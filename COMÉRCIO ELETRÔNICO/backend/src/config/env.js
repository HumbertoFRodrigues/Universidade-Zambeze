import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true })
export const env = {
  port: Number(process.env.PORT || 3000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
}
if (!process.env.DATABASE_URL) throw new Error('Configure DATABASE_URL em backend/.env ou no ambiente.')
if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) throw new Error('PORT inválida.')
// Cache futuro: REDIS_URL. Nenhum cliente Redis é criado nesta fase.
