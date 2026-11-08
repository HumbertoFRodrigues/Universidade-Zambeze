import { randomBytes } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// AT41 — Imagens enviadas por administradores e vendedores.
// O ficheiro chega como corpo binário (Content-Type image/*), é validado pelos
// "magic bytes" e guardado com nome aleatório numa pasta persistente (volume Docker).

export const pastaUploads = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : fileURLToPath(new URL('../../uploads', import.meta.url))

mkdirSync(pastaUploads, { recursive: true })

const TIPOS = [
  { extensao: 'jpg', testar: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { extensao: 'png', testar: b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { extensao: 'webp', testar: b => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP' },
]

export async function enviarImagem(request, response) {
  if (!['ADMINISTRADOR', 'VENDEDOR'].includes(request.utilizador.perfil)) {
    return response.status(403).json({ message: 'Só administradores e vendedores podem enviar imagens.' })
  }
  const corpo = request.body
  if (!Buffer.isBuffer(corpo) || corpo.length < 12) {
    return response.status(400).json({ message: 'Envie uma imagem JPG, PNG ou WebP (até 3 MB).' })
  }
  const tipo = TIPOS.find(item => item.testar(corpo))
  if (!tipo) return response.status(415).json({ message: 'O ficheiro não é uma imagem JPG, PNG ou WebP válida.' })
  try {
    const nome = `${Date.now().toString(36)}-${randomBytes(8).toString('hex')}.${tipo.extensao}`
    await writeFile(path.join(pastaUploads, nome), corpo, { flag: 'wx' })
    return response.status(201).json({ url: `/api/uploads/${nome}` })
  } catch (error) {
    console.error('Erro ao guardar imagem:', error)
    return response.status(500).json({ message: 'Não foi possível guardar a imagem.' })
  }
}
