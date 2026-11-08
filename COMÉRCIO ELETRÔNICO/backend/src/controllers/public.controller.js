import { prisma } from '../lib/prisma.js'

export async function listarCategorias(_request, response) {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { activo: true },
      select: { id: true, nome: true, categoriaPaiId: true, _count: { select: { produtos: { where: { activo: true } } } } },
      orderBy: [{ categoriaPaiId: 'asc' }, { nome: 'asc' }],
    })
    return response.json({
      categorias: categorias.map(({ _count, ...categoria }) => ({
        ...categoria,
        totalProdutos: _count.produtos,
      })),
    })
  } catch (error) {
    console.error('Erro ao listar categorias:', error)
    return response.status(500).json({ message: 'Não foi possível carregar as categorias.' })
  }
}

export async function obterConfiguracaoPublica(_request, response) {
  try {
    const configuracao = await prisma.configuracaoLoja.findUnique({
      where: { id: 1 },
      select: {
        nomeMarca: true,
        designacaoLegal: true,
        sobre: true,
        morada: true,
        referenciaLocalizacao: true,
        telefone: true,
        email: true,
        horarioAtendimento: true,
        nuit: true,
        codigoMoeda: true,
        regrasComerciais: true,
      },
    })
    return response.json({ configuracao })
  } catch (error) {
    console.error('Erro ao obter configuração pública:', error)
    return response.status(500).json({ message: 'Não foi possível carregar as informações da loja.' })
  }
}

export async function listarPoliticas(_request, response) {
  try {
    const politicas = await prisma.politicaLoja.findMany({
      select: { tipoPolitica: true, titulo: true, conteudo: true, versao: true, actualizadoEm: true },
      orderBy: { tipoPolitica: 'asc' },
    })
    return response.json({ politicas })
  } catch (error) {
    console.error('Erro ao listar políticas:', error)
    return response.status(500).json({ message: 'Não foi possível carregar as políticas.' })
  }
}
