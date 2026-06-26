import { Hono } from 'hono'
import type { Env } from '../types'

export const example = new Hono<{ Bindings: Env }>()

// Route protégée d'exemple : illustre le pattern routes/handlers.
// L'authentification et le rate-limit sont appliqués dans index.ts.
example.get('/', (c) => c.json({ message: 'authenticated', at: Date.now() }))
