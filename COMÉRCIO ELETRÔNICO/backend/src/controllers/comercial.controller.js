import { prisma } from '../lib/prisma.js'

// 1. Informações da Loja (Contactos, Vendedor, Localização)
export async function obterInformacoesLoja(req, res) {
  try {
    const config = await prisma.configuracaoLoja.findUnique({ where: { id: 1 } })
    if (!config) return res.status(404).json({ message: 'Configuração da loja não encontrada.' })
    return res.status(200).json(config)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro ao obter informações comerciais da loja.' })
  }
}

// 2. Políticas e Garantias
export async function listarPoliticas(req, res) {
  try {
    // Retorna apenas o índice das políticas para construir os menus (sem o texto completo)
    const politicas = await prisma.politicaLoja.findMany({
      select: { tipoPolitica: true, titulo: true, versao: true, actualizadoEm: true },
      orderBy: { tipoPolitica: 'asc' }
    })
    return res.status(200).json(politicas)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro ao listar políticas da loja.' })
  }
}

export async function obterPoliticaEspecifica(req, res) {
  try {
    const tipo = String(req.params.tipo).toUpperCase()
    const politica = await prisma.politicaLoja.findUnique({ where: { tipoPolitica: tipo } })
    if (!politica) return res.status(404).json({ message: 'Política não encontrada.' })
    return res.status(200).json(politica)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro ao obter detalhes da política.' })
  }
}

// 3. Formas de Pagamento Activas
export async function listarFormasPagamento(req, res) {
  try {
    const pagamentos = await prisma.formaPagamento.findMany({
      where: { activo: true },
      select: { id: true, codigo: true, nome: true, simulado: true },
      orderBy: { id: 'asc' }
    })
    return res.status(200).json(pagamentos)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro ao listar formas de pagamento.' })
  }
}

// 4. Zonas, Modalidades e Tarifas de Entrega Activas
export async function listarOpcoesEntrega(req, res) {
  try {
    const zonas = await prisma.zonaEntrega.findMany({
      where: { activo: true },
      include: {
        tarifas: {
          where: { activo: true },
          include: {
            modalidadeEntrega: {
              select: { id: true, nome: true, levantamentoLoja: true }
            }
          }
        }
      },
      orderBy: { nome: 'asc' }
    })
    return res.status(200).json(zonas)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro ao listar opções de entrega.' })
  }
}