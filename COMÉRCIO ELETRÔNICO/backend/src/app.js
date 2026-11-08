import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import { routes } from './routes/index.js'
import { errorHandler } from './middlewares/error-handler.js'
import { bloqueioGlobal } from './middlewares/bloqueio-ip.middleware.js'
import { verificarSessao } from './middlewares/auth.middleware.js'
import { enviarImagem, pastaUploads } from './controllers/uploads.controller.js'

export const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 'loopback, linklocal, uniquelocal')
app.use(helmet())
app.use(cors({ origin: env.corsOrigin }))
app.use(bloqueioGlobal)
app.use(express.json({ limit: '100kb' }))

// Upload de imagens (AT41): corpo binário até 3 MB, validado por magic bytes.
app.post('/api/uploads', verificarSessao, express.raw({ type: 'image/*', limit: '3mb' }), enviarImagem)
app.use('/api/uploads', express.static(pastaUploads, { maxAge: '7d', immutable: true }))

app.use('/api', routes)
app.use((_request, response) => response.status(404).json({ message: 'Rota não encontrada.' }))
app.use(errorHandler)
