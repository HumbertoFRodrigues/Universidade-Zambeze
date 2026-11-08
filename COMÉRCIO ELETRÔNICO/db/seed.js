import { criarDadosSeed, resumirDados } from './seed/dados.js'
import { gravarDadosSeed } from './seed/gravar.js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'

dotenv.config({ path: fileURLToPath(new URL('../backend/.env', import.meta.url)), quiet: true })

const dados = criarDadosSeed({
  referencia: process.env.SEED_REFERENCE_DATE ? new Date(process.env.SEED_REFERENCE_DATE) : new Date(),
  palavraPasse: process.env.SEED_PASSWORD || 'EasyShopTeste!2026',
})

if (process.argv.includes('--dry-run')) {
  console.table(resumirDados(dados))
  console.log('Pré-visualização: nenhum acesso ao banco, nenhuma alteração.')
} else {
  const { prisma } = await import('../backend/src/lib/prisma.js')
  try {
    const resultado = await gravarDadosSeed(prisma, dados)
    console.table(resultado)
    console.log('Seed EasyShop concluído. Registos existentes preservados; pagamentos são simulados.')
  } catch (error) {
    console.error('Seed não aplicado; a transacção foi revertida:', error.message)
    process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}
