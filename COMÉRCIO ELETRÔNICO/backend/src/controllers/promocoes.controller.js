import { prisma } from '../lib/prisma.js'

const ESTADOS_PAGOS = ['EM_PROCESSAMENTO', 'CONCLUIDA']
const MIN_ENCOMENDAS_HABITUAL = 2

function precoComDesconto(promocao, preco) {
  const base = Number(preco)
  const final = promocao.tipoDesconto === 'PERCENTAGEM'
    ? base * (1 - Number(promocao.valorDesconto) / 100)
    : base - Number(promocao.valorDesconto)
  return Number(Math.max(0, final).toFixed(2))
}

async function perfilCliente(utilizadorId) {
  const encomendas = await prisma.encomenda.findMany({
    where: { utilizadorId, estado: { in: ESTADOS_PAGOS } },
    select: { itens: { select: { produto: { select: { categoriaId: true } } } } },
  })
  const categorias = new Map()
  for (const encomenda of encomendas) {
    for (const item of encomenda.itens) {
      const id = item.produto?.categoriaId
      if (id != null) categorias.set(id, (categorias.get(id) || 0) + 1)
    }
  }
  return { totalEncomendas: encomendas.length, categorias }
}

// Promoções activas para o popup da loja; personaliza a ordem para clientes habituais.
export async function promocoesDestaque(request, response) {
  const agora = new Date()
  const promocoes = await prisma.promocao.findMany({
    where: { activo: true, inicioEm: { lte: agora }, fimEm: { gte: agora }, produtos: { some: { produto: { activo: true } } } },
    orderBy: [{ inicioEm: 'desc' }, { id: 'desc' }],
    take: 12,
    select: {
      id: true, nome: true, descricao: true, tipoDesconto: true, valorDesconto: true, fimEm: true,
      produtos: {
        where: { produto: { activo: true, quantidadeStock: { gt: 0 } } },
        take: 3,
        select: {
          produto: {
            select: {
              id: true, slug: true, nome: true, marca: true, preco: true, categoriaId: true,
              imagens: { select: { url: true }, orderBy: [{ principal: 'desc' }, { ordem: 'asc' }], take: 1 },
            },
          },
        },
      },
    },
  })

  let cliente = null
  let categoriasCliente = new Map()
  if (request.utilizador?.id) {
    const perfil = await perfilCliente(request.utilizador.id)
    categoriasCliente = perfil.categorias
    if (perfil.totalEncomendas >= MIN_ENCOMENDAS_HABITUAL) {
      cliente = { nome: request.utilizador.nome?.split(' ')[0] || null, encomendas: perfil.totalEncomendas }
    }
  }

  const relevancia = promocao => promocao.produtos
    .reduce((soma, { produto }) => soma + (categoriasCliente.get(produto.categoriaId) || 0), 0)

  const resultado = promocoes
    .filter(promocao => promocao.produtos.length)
    .map(promocao => ({
      id: promocao.id,
      nome: promocao.nome,
      descricao: promocao.descricao,
      desconto: promocao.tipoDesconto === 'PERCENTAGEM' ? `-${Number(promocao.valorDesconto)}%` : `-${Number(promocao.valorDesconto)} MT`,
      terminaEm: promocao.fimEm,
      paraSi: cliente ? relevancia(promocao) > 0 : false,
      produtos: promocao.produtos.map(({ produto }) => ({
        slug: produto.slug,
        nome: produto.nome,
        marca: produto.marca,
        preco: Number(produto.preco),
        precoPromocional: precoComDesconto(promocao, produto.preco),
        imagem: produto.imagens[0]?.url || null,
      })),
    }))
    .sort((a, b) => Number(b.paraSi) - Number(a.paraSi))

  response.json({ clienteHabitual: cliente, promocoes: resultado })
}

// ───────────────────────── Administração de promoções ─────────────────────────
// Uma promoção aplica-se a produtos (PromocaoProduto). Quando se escolhe uma categoria,
// associam-se todos os produtos activos dessa categoria e das subcategorias, para que o
// catálogo, o popup e o checkout mostrem e cobrem o mesmo preço.

const erro400 = message => ({ status: 400, message })

function situacao(promocao, agora = new Date()) {
  if (!promocao.activo) return 'DESACTIVADA'
  if (promocao.inicioEm > agora) return 'AGENDADA'
  if (promocao.fimEm < agora) return 'TERMINADA'
  return 'ACTIVA'
}

function validarPromocao(dados = {}, parcial = false) {
  const saida = {}
  if (!parcial || dados.nome !== undefined) {
    const nome = typeof dados.nome === 'string' ? dados.nome.trim() : ''
    if (!nome || nome.length > 150) throw erro400('Indique o nome da promoção (até 150 caracteres).')
    saida.nome = nome
  }
  if (dados.descricao !== undefined) {
    const descricao = typeof dados.descricao === 'string' ? dados.descricao.trim() : ''
    if (descricao.length > 255) throw erro400('A descrição não pode exceder 255 caracteres.')
    saida.descricao = descricao || null
  }
  if (!parcial || dados.tipoDesconto !== undefined || dados.valorDesconto !== undefined) {
    if (!['PERCENTAGEM', 'FIXO'].includes(dados.tipoDesconto)) throw erro400('Escolha o tipo de desconto: percentagem ou valor fixo.')
    const valor = Number(dados.valorDesconto)
    if (!Number.isFinite(valor) || valor <= 0) throw erro400('Indique um valor de desconto maior que zero.')
    if (dados.tipoDesconto === 'PERCENTAGEM' && valor > 90) throw erro400('A percentagem de desconto não pode passar de 90%.')
    saida.tipoDesconto = dados.tipoDesconto
    saida.valorDesconto = valor.toFixed(2)
  }
  if (!parcial || dados.inicioEm !== undefined || dados.fimEm !== undefined) {
    const inicio = new Date(dados.inicioEm)
    const fim = new Date(dados.fimEm)
    if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fim.getTime())) throw erro400('Indique as datas de início e de fim.')
    if (fim <= inicio) throw erro400('A data de fim tem de ser depois da data de início.')
    saida.inicioEm = inicio
    saida.fimEm = fim
  }
  if (dados.activo !== undefined) {
    if (typeof dados.activo !== 'boolean') throw erro400('O estado da promoção é inválido.')
    saida.activo = dados.activo
  }
  return saida
}

// Produtos abrangidos: lista explícita e/ou todos os de uma categoria (incluindo subcategorias).
async function produtosAbrangidos({ categoriaId, produtoIds }) {
  const ids = new Set(Array.isArray(produtoIds) ? produtoIds.filter(id => typeof id === 'string' && id) : [])
  let categoria = null
  if (categoriaId !== undefined && categoriaId !== null && categoriaId !== '') {
    categoria = await prisma.categoria.findUnique({ where: { id: Number(categoriaId) }, select: { id: true } })
    if (!categoria) throw erro400('A categoria escolhida não existe.')
    const produtos = await prisma.produto.findMany({
      where: { activo: true, OR: [{ categoriaId: categoria.id }, { categoria: { categoriaPaiId: categoria.id } }] },
      select: { id: true },
    })
    produtos.forEach(produto => ids.add(produto.id))
  }
  if (!ids.size) throw erro400('Escolha uma categoria ou pelo menos um produto.')
  const existentes = await prisma.produto.findMany({ where: { id: { in: [...ids] } }, select: { id: true } })
  if (existentes.length !== ids.size) throw erro400('Um dos produtos escolhidos não existe.')
  return { categoriaId: categoria?.id ?? null, ids: [...ids] }
}

const selecaoAdmin = {
  id: true, nome: true, descricao: true, tipoDesconto: true, valorDesconto: true, inicioEm: true, fimEm: true, activo: true,
  categoria: { select: { id: true, nome: true } },
  _count: { select: { produtos: true } },
}

function formatarAdmin({ _count, ...promocao }) {
  return { ...promocao, valorDesconto: Number(promocao.valorDesconto), totalProdutos: _count?.produtos ?? 0, situacao: situacao(promocao) }
}

export async function listarPromocoesAdmin(_req, res) {
  const promocoes = await prisma.promocao.findMany({ orderBy: [{ inicioEm: 'desc' }, { id: 'desc' }], select: selecaoAdmin })
  res.json({ promocoes: promocoes.map(formatarAdmin) })
}

export async function obterPromocaoAdmin(req, res) {
  const promocao = await prisma.promocao.findUnique({
    where: { id: Number(req.params.id) || 0 },
    select: { ...selecaoAdmin, produtos: { select: { produto: { select: { id: true, nome: true, marca: true, preco: true, slug: true } } } } },
  })
  if (!promocao) return res.status(404).json({ message: 'Promoção não encontrada.' })
  const { produtos, ...resto } = promocao
  const base = formatarAdmin(resto)
  res.json({
    promocao: {
      ...base,
      totalProdutos: produtos.length,
      produtos: produtos.map(({ produto }) => ({ ...produto, preco: Number(produto.preco), precoPromocional: precoComDesconto(resto, produto.preco) })),
    },
  })
}

export async function criarPromocaoAdmin(req, res) {
  const dados = validarPromocao(req.body)
  const alcance = await produtosAbrangidos(req.body ?? {})
  const criada = await prisma.$transaction(async tx => {
    const promocao = await tx.promocao.create({
      data: { ...dados, activo: dados.activo ?? true, categoriaId: alcance.categoriaId },
      select: { id: true },
    })
    await tx.promocaoProduto.createMany({ data: alcance.ids.map(produtoId => ({ promocaoId: promocao.id, produtoId })) })
    await tx.registoAuditoria.create({
      data: {
        utilizadorAutorId: req.utilizador?.id ?? null, accao: 'PROMOCAO_CRIADA', tipoEntidade: 'promocao',
        idEntidade: String(promocao.id), detalhes: { nome: dados.nome, produtos: alcance.ids.length },
      },
    })
    return promocao
  })
  res.status(201).json({ message: `Promoção criada com ${alcance.ids.length} produtos.`, id: criada.id })
}

export async function actualizarPromocaoAdmin(req, res) {
  const id = Number(req.params.id) || 0
  const existente = await prisma.promocao.findUnique({ where: { id }, select: { id: true } })
  if (!existente) return res.status(404).json({ message: 'Promoção não encontrada.' })
  const corpo = req.body ?? {}
  const dados = validarPromocao(corpo, true)
  const mudaAlcance = corpo.categoriaId !== undefined || corpo.produtoIds !== undefined
  const alcance = mudaAlcance ? await produtosAbrangidos(corpo) : null
  await prisma.$transaction(async tx => {
    await tx.promocao.update({ where: { id }, data: { ...dados, ...(alcance ? { categoriaId: alcance.categoriaId } : {}) } })
    if (alcance) {
      await tx.promocaoProduto.deleteMany({ where: { promocaoId: id } })
      await tx.promocaoProduto.createMany({ data: alcance.ids.map(produtoId => ({ promocaoId: id, produtoId })) })
    }
    await tx.registoAuditoria.create({
      data: {
        utilizadorAutorId: req.utilizador?.id ?? null, accao: 'PROMOCAO_ALTERADA', tipoEntidade: 'promocao',
        idEntidade: String(id), detalhes: { campos: Object.keys(dados), produtos: alcance?.ids.length ?? null },
      },
    })
  })
  const mensagem = dados.activo === false ? 'Promoção desactivada.' : dados.activo === true ? 'Promoção activada.' : 'Promoção actualizada.'
  res.json({ message: mensagem })
}
