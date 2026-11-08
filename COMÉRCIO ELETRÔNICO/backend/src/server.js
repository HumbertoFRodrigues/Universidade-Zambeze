import { app } from './app.js'
import { env } from './config/env.js'
import { prisma } from './lib/prisma.js'
await prisma.$connect()
const server = app.listen(env.port, '0.0.0.0', () => console.log('API disponível na porta ' + env.port))
server.timeout = 180000
server.keepAliveTimeout = 180000
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    const timeout = setTimeout(() => process.exit(1), 10000).unref()
    server.close(async () => {
      await prisma.$disconnect()
      clearTimeout(timeout)
      process.exit(0)
    })
  })
}
