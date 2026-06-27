function pemToArrayBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function toBase64Url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function createJWT(clientEmail: string, privateKeyPem: string): Promise<string> {
  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const payload = toBase64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  )
  const signingInput = `${header}.${payload}`

  const keyData = pemToArrayBuffer(privateKeyPem)
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBuffer = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  )

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return `${signingInput}.${signature}`
}

export async function getAccessToken({
  clientEmail,
  privateKeyPem,
}: {
  clientEmail: string
  privateKeyPem: string
}): Promise<string> {
  const jwt = await createJWT(clientEmail, privateKeyPem)
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!resp.ok) {
    throw new Error(`OAuth token exchange failed: ${resp.status}`)
  }
  const data = (await resp.json()) as { access_token: string }
  return data.access_token
}

export interface FCMPayloadParams {
  token: string
  title: string
  body: string
  /** Optional key/value data delivered alongside the notification. */
  data?: Record<string, string>
}

export function buildFCMPayload(params: FCMPayloadParams) {
  const { token, title, body, data } = params

  return {
    message: {
      token,
      notification: { title, body },
      ...(data ? { data } : {}),
      android: { priority: 'high' as const },
      apns: {
        headers: {
          'apns-priority': '10',
        },
      },
    },
  }
}

export interface SendFCMParams extends FCMPayloadParams {
  projectId: string
  clientEmail: string
  privateKeyPem: string
}

export class FCMError extends Error {
  readonly statusCode: number
  readonly errorCode: string | null

  constructor({ statusCode, errorCode }: { statusCode: number; errorCode: string | null }) {
    super(`FCM send failed: ${statusCode}`)
    this.name = 'FCMError'
    this.statusCode = statusCode
    this.errorCode = errorCode
  }
}

type FCMErrorBody = {
  error?: {
    details?: Array<{ errorCode?: string }>
  }
}

function extractFCMErrorCode(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null
  const details = (body as FCMErrorBody).error?.details
  if (!Array.isArray(details)) return null
  for (const d of details) {
    if (typeof d?.errorCode === 'string') return d.errorCode
  }
  return null
}

export async function sendFCMNotification(params: SendFCMParams): Promise<void> {
  const { projectId, clientEmail, privateKeyPem, ...payloadParams } = params
  const accessToken = await getAccessToken({ clientEmail, privateKeyPem })
  const payload = buildFCMPayload(payloadParams)

  const resp = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!resp.ok) {
    const body = await resp.json().catch(() => null)
    throw new FCMError({ statusCode: resp.status, errorCode: extractFCMErrorCode(body) })
  }
}
