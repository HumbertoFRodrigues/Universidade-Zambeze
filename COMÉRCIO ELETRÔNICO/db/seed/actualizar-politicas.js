// Actualiza as políticas numa base já existente (o seed preserva registos existentes).
// Uso: node db/seed/actualizar-politicas.js
import { PrismaClient } from '@prisma/client'
import { POLITICAS } from './politicas.js'

const prisma = new PrismaClient()
try {
  for (const [tipoPolitica, titulo, conteudo] of POLITICAS) {
    const actual = await prisma.politicaLoja.findUnique({ where: { tipoPolitica } })
    if (actual?.conteudo === conteudo && actual.titulo === titulo) continue
    await prisma.politicaLoja.upsert({
      where: { tipoPolitica },
      create: { tipoPolitica, titulo, conteudo },
      update: { titulo, conteudo, versao: { increment: 1 } },
    })
    console.log('Actualizada:', tipoPolitica)
  }
} finally {
  await prisma.$disconnect()
}
