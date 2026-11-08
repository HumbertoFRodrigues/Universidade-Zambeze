// Actualiza nomes visíveis ao cliente numa base já existente (o seed não sobrescreve registos).
// Uso: node db/seed/actualizar-textos.js
import { PrismaClient } from '@prisma/client'
import { criarDadosSeed } from './dados.js'

const prisma = new PrismaClient()
const dados = criarDadosSeed()
try {
  for (const zona of dados.zonaEntrega) {
    await prisma.zonaEntrega.updateMany({ where: { id: zona.id }, data: { nome: zona.nome, descricao: zona.descricao } })
  }
  for (const modalidade of dados.modalidadeEntrega) {
    await prisma.modalidadeEntrega.updateMany({ where: { id: modalidade.id }, data: { nome: modalidade.nome } })
  }
  const loja = dados.configuracaoLoja[0]
  await prisma.configuracaoLoja.updateMany({
    where: { id: loja.id, morada: { startsWith: 'Rua de Demonstração' } },
    data: { morada: loja.morada, referenciaLocalizacao: loja.referenciaLocalizacao },
  })
  console.log('Textos de zonas, modalidades e loja actualizados.')
} finally {
  await prisma.$disconnect()
}
