import { createMiddleware } from 'hono/factory'
import type { Env } from '../types'

// Byte-by-byte XOR comparison: runs in constant time relative to the key
// contents so the check cannot be used as a timing oracle.
function safeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder()
  const left = encoder.encode(a)
  const right = encoder.encode(b)
  if (left.byteLength !== right.byteLength) return false
  let diff = 0
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i]
  return diff === 0
}

export const apiKeyAuth = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const apiKey = c.req.header('x-api-key')

  if (!apiKey || !c.env.API_KEY || !safeEqual(apiKey, c.env.API_KEY)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await next()
})
