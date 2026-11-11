import { createHash } from 'crypto'

// Hash (no el token) del token de operación. Alternativa: CRON_SECRET en Vercel.
const OPS_TOKEN_SHA256 = '061a476b747a5fe4933e8ccb3447de31ba17ea0536e73e8078e2ff591f8f253e'

/** Autoriza tareas de operación: cron de Vercel (CRON_SECRET) o el token de operación. */
export function opsAuthorized(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return false
  if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) return true
  return createHash('sha256').update(token).digest('hex') === OPS_TOKEN_SHA256
}
