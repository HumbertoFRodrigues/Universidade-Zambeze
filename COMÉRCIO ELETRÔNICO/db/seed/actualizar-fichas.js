// Actualiza descrição e ficha técnica dos produtos numa base já existente, pelo nome (sem novo seed).
// Uso: node db/seed/actualizar-fichas.js
import { PrismaClient } from '@prisma/client'
import { fichas } from './fichas.js'

const prisma = new PrismaClient()
try {
  let actualizados = 0
  const semProduto = []
  for (const [nome, ficha] of Object.entries(fichas)) {
    const produtos = await prisma.produto.findMany({ where: { nome }, select: { id: true, especificacoes: true } })
    if (!produtos.length) {
      semProduto.push(nome)
      continue
    }
    for (const produto of produtos) {
      const actuais = produto.especificacoes && typeof produto.especificacoes === 'object' && !Array.isArray(produto.especificacoes)
        ? produto.especificacoes
        : {}
      await prisma.produto.update({
        where: { id: produto.id },
        data: { descricao: ficha.descricao, especificacoes: { ...actuais, ...ficha.especificacoes } },
      })
      actualizados++
    }
  }
  console.log(`Produtos actualizados: ${actualizados}`)
  if (semProduto.length) console.log(`Sem produto com este nome (${semProduto.length}):`, semProduto.join('; '))
} finally {
  await prisma.$disconnect()
}
