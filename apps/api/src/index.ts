import { Hono } from 'hono'
import type { HealthResponse } from '@repo/shared/types/api'
import { apiKeyAuth } from './middleware/auth'
import { rateLimiter } from './middleware/rateLimiter'
import { example } from './routes/example'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

app.onError((err, c) => {
  if (err instanceof SyntaxError) {
    return c.json({ error: 'invalid_json' }, 400)
  }
  console.error(err)
  return c.json({ error: 'Internal error' }, 500)
})

app.get('/health', (c) =>
  c.json<HealthResponse>({ status: 'ok', timestamp: Date.now() }),
)

app.use('/example/*', rateLimiter)
app.use('/example/*', apiKeyAuth)
app.route('/example', example)

app.get('/', (c) => c.json({ status: 'ok' }))

export { app }

export default {
  fetch: app.fetch,
}
