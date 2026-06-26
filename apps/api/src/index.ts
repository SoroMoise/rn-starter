import { Hono } from 'hono'
import { handleCron } from './handlers/cron'
import { apiKeyAuth } from './middleware/auth'
import { rateLimiter } from './middleware/rateLimiter'
import { alerts } from './routes/alerts'
import { history } from './routes/history'
import { rates } from './routes/rates'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

app.onError((err, c) => {
  if (err instanceof SyntaxError) {
    return c.json({ error: 'invalid_json' }, 400)
  }
  console.error(err)
  return c.json({ error: 'Internal error' }, 500)
})

app.use('/rates/*', rateLimiter)
app.use('/rates/*', apiKeyAuth)
app.route('/rates', rates)
app.route('/rates', history)

app.use('/alerts/*', rateLimiter)
app.use('/alerts/*', apiKeyAuth)
app.route('/alerts', alerts)

app.get('/', (c) => c.json({ status: 'ok' }))

export { app }

export default {
  fetch: app.fetch,
  scheduled: handleCron,
}
