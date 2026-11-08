import { prisma } from '../lib/prisma.js'
import { Prisma } from '@prisma/client'

const camposSeleccao = {
  id: true,
  slug: true,
  nome: true,
  codigo: true,
  marca: true,
  descricao: true,
  especificacoes: true,
  garantia: true,
  preco: true,
  codigoMoeda: true,
  criadoEm: true,
  quantidadeStock: true, // Necessário internamente para calcular a disponibilidade sem expor o valor exacto
  limiarStockBaixo: true,
  categoria: { select: { id: true, nome: true } },
  imagens: {
    select: { id: true, url: true, textoAlternativo: true, ordem: true, principal: true },
    orderBy: [{ principal: 'desc' }, { ordem: 'asc' }, { id: 'asc' }],
  },
  promocoes: {
    select: {
      promocao: {
        select: {
          nome: true,
          tipoDesconto: true,
          valorDesconto: true,
          inicioEm: true,
          fimEm: true,
          activo: true,
        },
      },
    },
  },
}

// Função auxiliar para determinar a disponibilidade cumprindo o RF-02.08
function formatarDisponibilidade(quantidadeStock, limiarStockBaixo = 5) {
  if (quantidadeStock <= 0) return 'ESGOTADO'
  if (quantidadeStock <= (limiarStockBaixo ?? 5)) return 'STOCK_LIMITADO'
  return 'EM_STOCK'
}

function listaDeValores(valor) {
  return (Array.isArray(valor) ? valor : [valor])
    .flatMap(item => String(item ?? '').split(','))
    .map(item => item.trim())
    .filter(Boolean)
}

function inteiroPositivo(valor, padrao) {
  if (valor === undefined || valor === '') return padrao
  const numero = Number(valor)
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null
}

function whereComFiltros({ pesquisa, categoria, marcas, disponibilidade, promocao, precoMin, precoMax }) {
  const where = { activo: true }
  const termo = typeof pesquisa === 'string' ? pesquisa.trim() : ''

  if (termo) {
    where.OR = [
      { nome: { contains: termo, mode: 'insensitive' } },
      { descricao: { contains: termo, mode: 'insensitive' } },
      { marca: { contains: termo, mode: 'insensitive' } },
    ]
  }

  if (categoria) {
    const idCategoria = Number(categoria)
    const alvo = Number.isSafeInteger(idCategoria) && idCategoria > 0
      ? { id: idCategoria }
      : { nome: { equals: categoria, mode: 'insensitive' } }
    // Uma categoria principal inclui os produtos das suas subcategorias.
    where.AND = [...(where.AND || []), { OR: [{ categoria: alvo }, { categoria: { categoriaPai: alvo } }] }]
  }

  if (marcas.length === 1) where.marca = { equals: marcas[0], mode: 'insensitive' }
  if (marcas.length > 1) where.marca = { in: marcas, mode: 'insensitive' }

  if (disponibilidade === 'em-stock') where.quantidadeStock = { gt: 0 }
  if (disponibilidade === 'esgotado') where.quantidadeStock = 0

  if (promocao) {
    const agora = new Date()
    where.promocoes = {
      some: {
        promocao: {
          activo: true,
          inicioEm: { lte: agora },
          fimEm: { gte: agora },
        },
      },
    }
  }

  if (precoMin !== undefined || precoMax !== undefined) {
    where.preco = {}
    if (precoMin !== undefined) where.preco.gte = Number(precoMin)
    if (precoMax !== undefined) where.preco.lte = Number(precoMax)
  }

  return where
}

async function obterIndicadoresProdutos(produtos) {
  const ids = produtos.map(produto => produto.id)
  if (!ids.length) return new Map()

  const [avaliacoes, maisVendidos] = await Promise.all([
    prisma.$queryRaw`
      SELECT ap.produto_id AS "produtoId",
        AVG(ap.classificacao)::float8 AS "media",
        COUNT(ap.id)::int AS "total"
      FROM avaliacao_produto ap
      WHERE ap.produto_id IN (${Prisma.join(ids)}) AND ap.estado = 'APROVADA'
      GROUP BY ap.produto_id
    `,
    prisma.$queryRaw`
      SELECT ie.produto_id AS "produtoId",
        SUM(ie.quantidade)::int AS "unidadesVendidas"
      FROM item_encomenda ie
      JOIN encomenda e ON e.id = ie.encomenda_id
      WHERE e.estado IN ('EM_PROCESSAMENTO', 'CONCLUIDA')
      GROUP BY ie.produto_id
      ORDER BY SUM(ie.quantidade) DESC, ie.produto_id ASC
      LIMIT 10
    `,
  ])

  const mapaAvaliacoes = new Map(avaliacoes.map(item => [item.produtoId, item]))
  const mapaVendidos = new Map(maisVendidos.map(item => [item.produtoId, item.unidadesVendidas]))
  return new Map(produtos.map(produto => {
    const avaliacao = mapaAvaliacoes.get(produto.id)
    const novo = produto.criadoEm >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const agora = new Date()
    const ofertasActivas = produto.promocoes
      .map(({ promocao }) => promocao)
      .filter(promocao => promocao.activo && promocao.inicioEm <= agora && promocao.fimEm >= agora)
    const precoBase = Number(produto.preco)
    const ofertas = ofertasActivas.map(promocao => ({
      promocao,
      preco: Math.max(
        0,
        promocao.tipoDesconto === 'PERCENTAGEM'
          ? precoBase * (1 - Number(promocao.valorDesconto) / 100)
          : precoBase - Number(promocao.valorDesconto)
      ),
    })).filter(oferta => oferta.preco < precoBase).sort((a, b) => a.preco - b.preco)
    const melhorOferta = ofertas[0]
    const emPromocao = Boolean(melhorOferta)
    const maisVendido = mapaVendidos.has(produto.id)
    const badges = [
      ...(novo ? ['novo'] : []),
      ...(emPromocao ? ['oferta'] : []),
      ...(maisVendido ? ['mais-vendido'] : []),
    ]
    return [produto.id, {
      nota: avaliacao ? Number(Number(avaliacao.media).toFixed(1)) : 0,
      avaliacoes: avaliacao?.total || 0,
      unidadesVendidas: mapaVendidos.get(produto.id) || 0,
      novo,
      maisVendido,
      emPromocao,
      oferta: emPromocao,
      precoPromocional: melhorOferta ? Number(melhorOferta.preco.toFixed(2)) : null,
      nomePromocao: melhorOferta?.promocao.nome || null,
      badges,
    }]
  }))
}

export async function listarProdutos(request, response) {
  try {
    const {
      pesquisa,
      categoria,
      marca,
      disponibilidade = '',
      promocao = '',
      precoMin,
      precoMax,
      ordenar = 'recentes',
    } = request.query
    const pagina = inteiroPositivo(request.query.pagina, 1)
    const limiteSolicitado = inteiroPositivo(request.query.limite, 12)

    if (!pagina || !limiteSolicitado) {
      return response.status(400).json({ message: 'A página e o limite devem ser números inteiros positivos.' })
    }
    if (typeof pesquisa === 'string' && pesquisa.trim().length > 100) {
      return response.status(400).json({ message: 'A pesquisa não pode exceder 100 caracteres.' })
    }
    if (categoria !== undefined && typeof categoria !== 'string') {
      return response.status(400).json({ message: 'A categoria deve ser um único identificador ou nome.' })
    }
    if (!['', 'em-stock', 'esgotado'].includes(disponibilidade)) {
      return response.status(400).json({ message: 'A disponibilidade seleccionada não é válida.' })
    }
    if (!['', 'true', 'false'].includes(promocao)) {
      return response.status(400).json({ message: 'O filtro de promoção não é válido.' })
    }
    if (!['recentes', 'preco-asc', 'preco-desc', 'nome-asc'].includes(ordenar)) {
      return response.status(400).json({ message: 'A ordenação seleccionada não é válida.' })
    }

    const marcas = listaDeValores(marca)
    const valoresDePreco = { precoMin, precoMax }
    for (const [campo, valor] of Object.entries(valoresDePreco)) {
      if (valor !== undefined && (valor === '' || !Number.isFinite(Number(valor)) || Number(valor) < 0)) {
        return response.status(400).json({ message: `O parâmetro ${campo} deve ser um número não negativo.` })
      }
    }
    if (precoMin !== undefined && precoMax !== undefined && Number(precoMin) > Number(precoMax)) {
      return response.status(400).json({ message: 'O preço mínimo não pode ser superior ao preço máximo.' })
    }

    const filtros = {
      pesquisa: typeof pesquisa === 'string' ? pesquisa : '',
      categoria,
      marcas,
      disponibilidade,
      promocao: promocao === 'true',
      precoMin: precoMin === undefined ? undefined : Number(precoMin),
      precoMax: precoMax === undefined ? undefined : Number(precoMax),
    }
    const where = whereComFiltros(filtros)
    const whereSemMarca = whereComFiltros({ ...filtros, marcas: [] })
    const whereSemCategoria = whereComFiltros({ ...filtros, categoria: '' })
    const whereSemDisponibilidade = whereComFiltros({ ...filtros, disponibilidade: '' })
    const take = Math.min(limiteSolicitado, 50)
    const skip = (pagina - 1) * take

    let orderBy = [{ criadoEm: 'desc' }, { id: 'asc' }]
    if (ordenar === 'preco-asc') orderBy = [{ preco: 'asc' }, { id: 'asc' }]
    if (ordenar === 'preco-desc') orderBy = [{ preco: 'desc' }, { id: 'asc' }]
    if (ordenar === 'nome-asc') orderBy = [{ nome: 'asc' }, { id: 'asc' }]

    let [
      produtosRaw,
      total,
      marcasRaw,
      categoriasRaw,
      disponiveis,
      esgotados,
    ] = await Promise.all([
      prisma.produto.findMany({
        where,
        select: camposSeleccao,
        orderBy,
        take,
        skip,
      }),
      prisma.produto.count({ where }),
      prisma.produto.groupBy({
        by: ['marca'],
        where: { ...whereSemMarca, marca: { not: null } },
        _count: { _all: true },
        orderBy: { marca: 'asc' },
      }),
      prisma.produto.groupBy({
        by: ['categoriaId'],
        where: { ...whereSemCategoria, categoriaId: { not: null } },
        _count: { _all: true },
        orderBy: { categoriaId: 'asc' },
      }),
      prisma.produto.count({ where: { ...whereSemDisponibilidade, quantidadeStock: { gt: 0 } } }),
      prisma.produto.count({ where: { ...whereSemDisponibilidade, quantidadeStock: 0 } }),
    ])

    const totalPaginas = Math.ceil(total / take)
    const paginaFinal = Math.min(pagina, Math.max(totalPaginas, 1))
    if (paginaFinal !== pagina) {
      produtosRaw = await prisma.produto.findMany({
        where,
        select: camposSeleccao,
        orderBy,
        take,
        skip: (paginaFinal - 1) * take,
      })
    }

    const categoriaIds = categoriasRaw.map(item => item.categoriaId)
    const categorias = await prisma.categoria.findMany({
      where: { id: { in: categoriaIds }, activo: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    })
    const contagensCategorias = new Map(categoriasRaw.map(item => [item.categoriaId, item._count._all]))
    const indicadores = await obterIndicadoresProdutos(produtosRaw)

    // Não expor a quantidade exacta de stock nem as relações internas de promoção.
    const produtos = produtosRaw.map(({ quantidadeStock, limiarStockBaixo, ...produto }) => ({
      ...produto,
      disponibilidade: formatarDisponibilidade(quantidadeStock, limiarStockBaixo),
      ...indicadores.get(produto.id),
    }))

    return response.json({
      produtos,
      total,
      pagina: paginaFinal,
      limite: take,
      totalPaginas,
      facetas: {
        marcas: marcasRaw.map(item => ({ nome: item.marca, total: item._count._all })),
        categorias: categorias.map(item => ({
          ...item,
          total: contagensCategorias.get(item.id) || 0,
        })),
        disponibilidade: { 'em-stock': disponiveis, esgotado: esgotados },
      },
    })
  } catch (error) {
    console.error('Erro ao listar produtos:', error)
    return response.status(500).json({ message: 'Não foi possível carregar a listagem de produtos.' })
  }
}

export async function obterProduto(request, response) {
  try {
    const { slug } = request.params
    const produtoRaw = await prisma.produto.findUnique({
      where: { slug, activo: true },
      select: camposSeleccao,
    })

    if (!produtoRaw) {
      return response.status(404).json({ message: 'Produto não encontrado.' })
    }

    const indicadores = await obterIndicadoresProdutos([produtoRaw])
    const { quantidadeStock, limiarStockBaixo, ...produto } = produtoRaw

    // Buscar produtos relacionados da mesma categoria (RF-02.11)
    let relacionados = []
    if (produto.categoria?.id) {
      const relacionadosRaw = await prisma.produto.findMany({
        where: {
          activo: true,
          categoriaId: produto.categoria.id,
          id: { not: produto.id },
        },
        select: camposSeleccao,
        take: 4,
      })
      const indicadoresRelacionados = await obterIndicadoresProdutos(relacionadosRaw)
      relacionados = relacionadosRaw.map(({ quantidadeStock: qStock, limiarStockBaixo: limiar, ...p }) => ({
        ...p,
        disponibilidade: formatarDisponibilidade(qStock, limiar),
        ...indicadoresRelacionados.get(p.id),
      }))
    }

    return response.json({
      produto: {
        ...produto,
        disponibilidade: formatarDisponibilidade(quantidadeStock, limiarStockBaixo),
        ...indicadores.get(produto.id),
      },
      relacionados,
    })
  } catch (error) {
    console.error('Erro ao obter produto:', error)
    return response.status(500).json({ message: 'Não foi possível carregar os detalhes do produto.' })
  }
}

export async function listarAvaliacoesProduto(request, response) {
    try {
      const { slug } = request.params
      const pagina = inteiroPositivo(request.query.pagina, 1)
      const limiteSolicitado = inteiroPositivo(request.query.limite, 10)
      const nota = request.query.nota === undefined ? undefined : Number(request.query.nota)
      if (!pagina || !limiteSolicitado || (nota !== undefined && (!Number.isInteger(nota) || nota < 1 || nota > 5))) {
        return response.status(400).json({ message: 'Os parâmetros de paginação ou classificação não são válidos.' })
      }

      const produto = await prisma.produto.findUnique({
        where: { slug, activo: true },
        select: { id: true },
      })
      if (!produto) return response.status(404).json({ message: 'Produto não encontrado.' })

      const where = {
        produtoId: produto.id,
        estado: 'APROVADA',
        ...(nota ? { classificacao: nota } : {}),
      }
      const take = Math.min(limiteSolicitado, 50)
      const [avaliacoes, total] = await Promise.all([
        prisma.avaliacaoProduto.findMany({
          where,
          select: {
            classificacao: true,
            comentario: true,
            imagens: true,
            criadoEm: true,
            autor: { select: { nome: true } },
            itemEncomenda: {
              select: { encomenda: { select: { nomeContacto: true } } },
            },
          },
          orderBy: { criadoEm: 'desc' },
          take,
          skip: (pagina - 1) * take,
        }),
        prisma.avaliacaoProduto.count({ where }),
      ])

      return response.json({
        avaliacoes: avaliacoes.map(avaliacao => ({
          nota: avaliacao.classificacao,
          texto: avaliacao.comentario,
          imagens: avaliacao.imagens,
          data: avaliacao.criadoEm,
          nome: avaliacao.autor?.nome || avaliacao.itemEncomenda?.encomenda.nomeContacto || 'Cliente EasyShop',
          compraVerificada: Boolean(avaliacao.itemEncomenda),
        })),
        total,
        pagina,
        limite: take,
        totalPaginas: Math.ceil(total / take),
      })
    } catch (error) {
      console.error('Erro ao listar avaliações do produto:', error)
      return response.status(500).json({ message: 'Não foi possível carregar as avaliações do produto.' })
  }
}