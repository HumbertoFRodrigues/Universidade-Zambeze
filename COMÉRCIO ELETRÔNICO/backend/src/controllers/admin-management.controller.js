import { randomUUID } from 'node:crypto'
import { prisma } from '../lib/prisma.js'
import { emitirFactura } from '../services/factura.service.js'

function inteiro(valor, padrao, maximo = 50) {
  const numero = Number(valor)
  return Number.isSafeInteger(numero) && numero > 0 ? Math.min(numero, maximo) : padrao
}

const seleccaoProdutoAdmin = {
  id: true,
  slug: true,
  codigo: true,
  nome: true,
  marca: true,
  descricao: true,
  especificacoes: true,
  garantia: true,
  preco: true,
  codigoMoeda: true,
  quantidadeStock: true,
  limiarStockBaixo: true,
  activo: true,
  criadoEm: true,
  actualizadoEm: true,
  categoria: { select: { id: true, nome: true } },
  imagens: {
    select: { id: true, url: true, textoAlternativo: true, ordem: true, principal: true },
    orderBy: [{ principal: 'desc' }, { ordem: 'asc' }],
  },
  promocoes: {
    where: { promocao: { activo: true } },
    select: { promocao: { select: { id: true, nome: true, valorDesconto: true, tipoDesconto: true, inicioEm: true, fimEm: true } } },
  },
}

const seleccaoEncomendaAdmin = {
  id: true,
  codigoEncomenda: true,
  estado: true,
  nomeContacto: true,
  emailContacto: true,
  telefoneContacto: true,
  entregaNomeDestinatario: true,
  entregaTelefone: true,
  entregaLinhaEndereco: true,
  entregaCidade: true,
  entregaProvincia: true,
  entregaPontoReferencia: true,
  valorSubtotal: true,
  valorFrete: true,
  valorTotal: true,
  criadoEm: true,
  itens: {
    select: { id: true, nomeProduto: true, quantidade: true, precoUnitario: true, descontoUnitario: true },
  },
  pagamentos: {
    orderBy: { id: 'desc' },
    take: 1,
    select: { id: true, estado: true, referenciaOperacao: true, formaPagamento: { select: { nome: true } } },
  },
  entrega: { select: { estado: true, expedidoEm: true, entregueEm: true, observacao: true } },
  factura: { select: { id: true, numero: true, emitidaEm: true } },
  modalidadeEntrega: { select: { nome: true } },
  zonaEntrega: { select: { nome: true } },
}

function slugificar(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function listarProdutosAdmin(request, response) {
  try {
    const pagina = inteiro(request.query.pagina, 1, Number.MAX_SAFE_INTEGER)
    const limite = inteiro(request.query.limite, 20)
    const pesquisa = typeof request.query.pesquisa === 'string' ? request.query.pesquisa.trim() : ''
    const where = {
      ...(request.query.activo === 'false' ? { activo: false } : request.query.activo === 'true' ? { activo: true } : {}),
      ...(pesquisa ? { OR: [
        { nome: { contains: pesquisa, mode: 'insensitive' } },
        { codigo: { contains: pesquisa, mode: 'insensitive' } },
        { marca: { contains: pesquisa, mode: 'insensitive' } },
      ] } : {}),
    }
    const [produtos, total] = await Promise.all([
      prisma.produto.findMany({
        where,
        select: seleccaoProdutoAdmin,
        orderBy: [{ criadoEm: 'desc' }, { id: 'asc' }],
        take: limite,
        skip: (pagina - 1) * limite,
      }),
      prisma.produto.count({ where }),
    ])
    return response.json({ produtos, total, pagina, limite, totalPaginas: Math.ceil(total / limite) })
  } catch (error) {
    console.error('Erro ao listar produtos para administração:', error)
    return response.status(500).json({ message: 'Não foi possível carregar os produtos.' })
  }
}

export async function criarProdutoAdmin(request, response) {
  const { nome, codigo, marca, categoriaId, descricao, especificacoes, garantia, preco, quantidadeStock = 0, limiarStockBaixo = 5, imagens = [] } = request.body
  const precoValido = Number(preco)
  const categoriaNumerica = Number(categoriaId)
  const stockNumerico = Number(quantidadeStock)
  const limiarNumerico = Number(limiarStockBaixo)
  if (
    typeof nome !== 'string' || !nome.trim() ||
    !Number.isFinite(precoValido) || precoValido <= 0 ||
    !Number.isSafeInteger(categoriaNumerica) || categoriaNumerica <= 0 ||
    !Number.isSafeInteger(stockNumerico) || stockNumerico < 0 ||
    !Number.isSafeInteger(limiarNumerico) || limiarNumerico < 0 ||
    !Array.isArray(imagens)
  ) {
    return response.status(400).json({ message: 'Os dados do produto são inválidos ou incompletos.' })
  }
  try {
    const slug = slugificar(request.body.slug || nome)
    const produtoId = randomUUID()
    const imagemData = imagens.map((imagem, ordem) => ({
      url: typeof imagem === 'string' ? imagem : imagem.url,
      textoAlternativo: typeof imagem === 'string' ? nome.trim() : imagem.textoAlternativo || nome.trim(),
      ordem,
      principal: ordem === 0,
    })).filter(imagem => typeof imagem.url === 'string' && imagem.url.trim())
    const produto = await prisma.$transaction(async tx => {
      const criado = await tx.produto.create({
        data: {
          id: produtoId,
          slug,
          codigo: codigo?.trim() || null,
          nome: nome.trim(),
          marca: marca?.trim() || null,
          categoriaId: categoriaNumerica,
          descricao: String(descricao || ''),
          especificacoes: especificacoes ?? {},
          garantia: garantia || null,
          preco: String(precoValido),
          quantidadeStock: stockNumerico,
          limiarStockBaixo: limiarNumerico,
          imagens: { create: imagemData },
        },
      })
      if (stockNumerico) {
        await tx.movimentoStock.create({
          data: {
            produtoId: criado.id,
            tipoMovimento: 'ENTRADA',
            variacaoQuantidade: stockNumerico,
            stockApos: stockNumerico,
            motivo: 'Stock inicial de cadastro',
            criadoPor: request.admin.id,
          },
        })
      }
      await tx.registoAuditoria.create({
        data: {
          utilizadorAutorId: request.admin.id,
          accao: 'CRIAR_PRODUTO',
          tipoEntidade: 'produto',
          idEntidade: criado.id,
          detalhes: { nome: criado.nome, codigo: criado.codigo },
        },
      })
      return tx.produto.findUnique({ where: { id: criado.id }, select: seleccaoProdutoAdmin })
    })
    return response.status(201).json({ produto })
  } catch (error) {
    if (error.code === 'P2002') return response.status(409).json({ message: 'O slug ou código do produto já existe.' })
    if (error.code === 'P2003') return response.status(400).json({ message: 'A categoria seleccionada não existe.' })
    console.error('Erro ao criar produto administrativo:', error)
    return response.status(500).json({ message: 'Não foi possível criar o produto.' })
  }
}

export async function actualizarProdutoAdmin(request, response) {
  const { produtoId } = request.params
  const { nome, codigo, marca, categoriaId, descricao, especificacoes, garantia, preco, quantidadeStock, limiarStockBaixo, imagens, activo } = request.body
  if (typeof nome !== 'string' || !nome.trim() || !Number.isFinite(Number(preco)) || Number(preco) <= 0) {
    return response.status(400).json({ message: 'Nome e preço válido são obrigatórios.' })
  }
  try {
    const existente = await prisma.produto.findUnique({ where: { id: produtoId }, select: { id: true } })
    if (!existente) return response.status(404).json({ message: 'Produto não encontrado.' })

    const imagemData = Array.isArray(imagens)
      ? imagens.map((imagem, ordem) => ({
          url: typeof imagem === 'string' ? imagem : imagem.url,
          textoAlternativo: typeof imagem === 'string' ? nome.trim() : imagem.textoAlternativo || nome.trim(),
          ordem,
          principal: ordem === 0,
        })).filter(imagem => typeof imagem.url === 'string' && imagem.url.trim())
      : undefined
    const produto = await prisma.$transaction(async tx => {
      if (imagemData) {
        await tx.imagemProduto.deleteMany({ where: { produtoId } })
      }
      return tx.produto.update({
        where: { id: produtoId },
        data: {
          nome: nome.trim(),
          slug: typeof request.body.slug === 'string' && request.body.slug.trim() ? slugificar(request.body.slug) : slugificar(nome),
          codigo: codigo?.trim() || null,
          marca: marca?.trim() || null,
          categoriaId: Number(categoriaId),
          descricao: String(descricao || ''),
          especificacoes: especificacoes ?? {},
          garantia: garantia || null,
          preco: String(preco),
          ...(quantidadeStock !== undefined ? { quantidadeStock: Number(quantidadeStock) } : {}),
          ...(limiarStockBaixo !== undefined ? { limiarStockBaixo: Number(limiarStockBaixo) } : {}),
          ...(activo !== undefined ? { activo: Boolean(activo) } : {}),
          ...(imagemData ? { imagens: { create: imagemData } } : {}),
        },
        select: seleccaoProdutoAdmin,
      })
    })
    await prisma.registoAuditoria.create({
      data: {
        utilizadorAutorId: request.admin.id,
        accao: 'ACTUALIZAR_PRODUTO',
        tipoEntidade: 'produto',
        idEntidade: produtoId,
        detalhes: { nome: produto.nome },
      },
    })
    return response.json({ produto })
  } catch (error) {
    console.error('Erro ao actualizar produto:', error)
    return response.status(500).json({ message: 'Não foi possível actualizar o produto.' })
  }
}

export async function desactivarProdutoAdmin(request, response) {
  try {
    const produto = await prisma.produto.update({
      where: { id: request.params.produtoId },
      data: { activo: false },
      select: { id: true, nome: true, activo: true },
    })
    await prisma.registoAuditoria.create({
      data: {
        utilizadorAutorId: request.admin.id,
        accao: 'DESACTIVAR_PRODUTO',
        tipoEntidade: 'produto',
        idEntidade: produto.id,
        detalhes: { nome: produto.nome },
      },
    })
    return response.json({ produto })
  } catch (error) {
    if (error.code === 'P2025') return response.status(404).json({ message: 'Produto não encontrado.' })
    console.error('Erro ao desactivar produto:', error)
    return response.status(500).json({ message: 'Não foi possível desactivar o produto.' })
  }
}

export async function listarCategoriasAdmin(_request, response) {
  try {
    const categorias = await prisma.categoria.findMany({
      select: { id: true, nome: true, categoriaPaiId: true, activo: true, _count: { select: { produtos: true } } },
      orderBy: [{ categoriaPaiId: 'asc' }, { nome: 'asc' }],
    })
    return response.json({ categorias: categorias.map(({ _count, ...categoria }) => ({ ...categoria, totalProdutos: _count.produtos })) })
  } catch (error) {
    console.error('Erro ao listar categorias administrativas:', error)
    return response.status(500).json({ message: 'Não foi possível carregar as categorias.' })
  }
}

export async function actualizarCategoria(request, response) {
  const id = Number(request.params.categoriaId)
  const nome = request.body.nome?.trim()
  if (!Number.isSafeInteger(id) || id <= 0 || !nome) {
    return response.status(400).json({ message: 'Identificador e nome da categoria são obrigatórios.' })
  }
  try {
    const categoria = await prisma.categoria.update({
      where: { id },
      data: {
        nome,
        ...(request.body.activo !== undefined ? { activo: Boolean(request.body.activo) } : {}),
        ...(request.body.categoriaPaiId !== undefined ? { categoriaPaiId: request.body.categoriaPaiId ? Number(request.body.categoriaPaiId) : null } : {}),
      },
    })
    return response.json({ categoria })
  } catch (error) {
    if (error.code === 'P2025') return response.status(404).json({ message: 'Categoria não encontrada.' })
    if (error.code === 'P2002') return response.status(409).json({ message: 'Já existe uma categoria com esse nome.' })
    console.error('Erro ao actualizar categoria:', error)
    return response.status(500).json({ message: 'Não foi possível actualizar a categoria.' })
  }
}

export async function desactivarCategoria(request, response) {
  const id = Number(request.params.categoriaId)
  if (!Number.isSafeInteger(id) || id <= 0) return response.status(400).json({ message: 'Identificador de categoria inválido.' })
  try {
    const categoria = await prisma.categoria.update({ where: { id }, data: { activo: false } })
    return response.json({ categoria })
  } catch (error) {
    if (error.code === 'P2025') return response.status(404).json({ message: 'Categoria não encontrada.' })
    console.error('Erro ao desactivar categoria:', error)
    return response.status(500).json({ message: 'Não foi possível desactivar a categoria.' })
  }
}

function mapearEncomenda(encomenda) {
  const pagamento = encomenda.pagamentos[0]
  return {
    id: encomenda.id,
    codigo: encomenda.codigoEncomenda,
    estado: encomenda.estado,
    pagamentoEstado: pagamento?.estado || 'PENDENTE',
    pagamentoMetodo: pagamento?.formaPagamento.nome || '',
    pagamentoReferencia: pagamento?.referenciaOperacao || '',
    entregaEstado: encomenda.entrega?.estado || 'POR_EXPEDIR',
    nomeCliente: encomenda.nomeContacto,
    emailCliente: encomenda.emailContacto,
    telefoneCliente: encomenda.telefoneContacto,
    moradaEntrega: [encomenda.entregaLinhaEndereco, encomenda.entregaCidade, encomenda.entregaProvincia].filter(Boolean).join(', '),
    referenciaLocalizacao: encomenda.entregaPontoReferencia,
    destinatario: encomenda.entregaNomeDestinatario,
    telefoneDestinatario: encomenda.entregaTelefone,
    modalidadeEntrega: encomenda.modalidadeEntrega?.nome || null,
    zonaEntrega: encomenda.zonaEntrega?.nome || null,
    total: encomenda.valorTotal,
    subtotal: encomenda.valorSubtotal,
    frete: encomenda.valorFrete,
    data: encomenda.criadoEm,
    factura: encomenda.factura ?? null,
    itens: encomenda.itens.map(item => ({
      id: item.id,
      nome: item.nomeProduto,
      quantidade: item.quantidade,
      preco: item.precoUnitario,
      subtotal: Number(item.precoUnitario) * item.quantidade - Number(item.descontoUnitario) * item.quantidade,
    })),
  }
}

export async function listarEncomendasAdmin(request, response) {
  try {
    const limite = inteiro(request.query.limite, 20)
    const pesquisa = typeof request.query.pesquisa === 'string' ? request.query.pesquisa.trim() : ''
    const where = {
      ...(request.query.estado ? { estado: request.query.estado } : {}),
      ...(request.query.pagamento ? { pagamentos: { some: { estado: request.query.pagamento } } } : {}),
      ...(request.query.entrega ? { entrega: { estado: request.query.entrega } } : {}),
      ...(pesquisa ? { OR: [
        { codigoEncomenda: { contains: pesquisa, mode: 'insensitive' } },
        { nomeContacto: { contains: pesquisa, mode: 'insensitive' } },
        { emailContacto: { contains: pesquisa, mode: 'insensitive' } },
      ] } : {}),
    }
    const pagina = inteiro(request.query.pagina, 1, Number.MAX_SAFE_INTEGER)
    const [encomendas, total] = await Promise.all([
      prisma.encomenda.findMany({
        where,
        select: seleccaoEncomendaAdmin,
        orderBy: [{ criadoEm: 'desc' }, { id: 'desc' }],
        take: limite,
        skip: (pagina - 1) * limite,
      }),
      prisma.encomenda.count({ where }),
    ])
    return response.json({
      encomendas: encomendas.map(mapearEncomenda),
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    })
  } catch (error) {
    console.error('Erro ao listar encomendas administrativas:', error)
    return response.status(500).json({ message: 'Não foi possível carregar as encomendas.' })
  }
}

export async function actualizarEncomendaAdmin(request, response) {
  const id = Number(request.params.encomendaId)
  if (!Number.isSafeInteger(id) || id <= 0) return response.status(400).json({ message: 'Identificador de encomenda inválido.' })
  
  const { estado, pagamentoEstado, entregaEstado, observacao } = request.body
  const estadosEncomenda = ['REGISTADA', 'EM_PROCESSAMENTO', 'CONCLUIDA', 'CANCELADA']
  const estadosPagamento = ['PENDENTE', 'CONFIRMADO', 'FALHADO', 'REEMBOLSADO']
  const estadosEntrega = ['POR_EXPEDIR', 'EM_TRANSPORTE', 'ENTREGUE', 'NAO_ENTREGUE']
  
  if (estado !== undefined && !estadosEncomenda.includes(estado)) return response.status(400).json({ message: 'Estado de encomenda inválido.' })
  if (pagamentoEstado !== undefined && !estadosPagamento.includes(pagamentoEstado)) return response.status(400).json({ message: 'Estado de pagamento inválido.' })
  if (entregaEstado !== undefined && !estadosEntrega.includes(entregaEstado)) return response.status(400).json({ message: 'Estado de entrega inválido.' })

  try {
    const encomenda = await prisma.$transaction(async tx => {
      const actual = await tx.encomenda.findUnique({ where: { id }, select: { estado: true, valorTotal: true } })
      if (!actual) return null
      
      if (estado && estado !== actual.estado) {
        await tx.encomenda.update({ where: { id }, data: { estado } })
        await tx.historicoEstadoEncomenda.create({
          data: { encomendaId: id, estadoAnterior: actual.estado, estadoNovo: estado, alteradoPor: request.admin.id, observacao: observacao || null },
        })
      }
      
      if (pagamentoEstado) {
        const pagamento = await tx.pagamento.findFirst({ where: { encomendaId: id }, orderBy: { id: 'desc' } })
        if (pagamento) {
          await tx.pagamento.update({
            where: { id: pagamento.id },
            data: {
              estado: pagamentoEstado,
              ...(pagamentoEstado === 'CONFIRMADO' ? { confirmadoEm: new Date() } : {}),
            },
          })
        } else {
          await tx.pagamento.create({
            data: {
              encomendaId: id,
              formaPagamentoId: 1, 
              referenciaOperacao: `ADMIN-MANUAL-${id}-${Date.now()}`,
              valor: actual.valorTotal, 
              estado: pagamentoEstado,
              // Registado pelo administrador (por exemplo, transferência recebida): não é simulado.
              simulado: false,
              ...(pagamentoEstado === 'CONFIRMADO' ? { confirmadoEm: new Date() } : {}),
            }
          })
        }
      }
      
      // Pagamento confirmado: emite a factura (numerada nesta transacção; idempotente).
      if (pagamentoEstado === 'CONFIRMADO') await emitirFactura(tx, id)

      if (entregaEstado) {
        await tx.entrega.upsert({
          where: { encomendaId: id },
          create: { encomendaId: id, estado: entregaEstado, observacao: observacao || null },
          update: {
            estado: entregaEstado,
            observacao: observacao || null,
            ...(entregaEstado === 'EM_TRANSPORTE' ? { expedidoEm: new Date() } : {}),
            ...(entregaEstado === 'ENTREGUE' ? { entregueEm: new Date() } : {}),
          },
        })
      }
      return tx.encomenda.findUnique({ where: { id }, select: seleccaoEncomendaAdmin })
    })
    
    if (!encomenda) return response.status(404).json({ message: 'Encomenda não encontrada.' })
    return response.json({ encomenda: mapearEncomenda(encomenda) })
  } catch (error) {
    console.error('Erro ao actualizar encomenda:', error)
    return response.status(500).json({ message: 'Não foi possível actualizar a encomenda.' })
  }
}

export async function obterPainelAdmin(_request, response) {
  try {
    const [totalEncomendas, porPagar, porEntregar, receita, recentes, stockBaixo] = await Promise.all([
      prisma.encomenda.count(),
      prisma.pagamento.count({ where: { estado: 'PENDENTE' } }),
      prisma.entrega.count({ where: { estado: { in: ['POR_EXPEDIR', 'EM_TRANSPORTE'] } } }),
      prisma.pagamento.aggregate({ where: { estado: 'CONFIRMADO' }, _sum: { valor: true } }),
      prisma.encomenda.findMany({ select: seleccaoEncomendaAdmin, orderBy: { criadoEm: 'desc' }, take: 5 }),
      prisma.produto.findMany({
        where: { activo: true, quantidadeStock: { lte: 5 } },
        select: { id: true, nome: true, quantidadeStock: true },
        orderBy: { quantidadeStock: 'asc' },
        take: 6,
      }),
    ])
    return response.json({
      indicadores: {
        totalEncomendas,
        receita: receita._sum.valor || 0,
        porPagar,
        porEntregar,
      },
      recentes: recentes.map(mapearEncomenda),
      stockBaixo,
    })
  } catch (error) {
    console.error('Erro ao carregar painel administrativo:', error)
    return response.status(500).json({ message: 'Não foi possível carregar o painel administrativo.' })
  }
}

export async function obterConfiguracaoAdmin(_request, response) {
    try {
      const configuracao = await prisma.configuracaoLoja.findUnique({ where: { id: 1 } })
      if (!configuracao) return response.status(404).json({ message: 'A configuração da loja ainda não foi criada.' })
      return response.json({ configuracao })
    } catch (error) {
      console.error('Erro ao carregar configuração administrativa:', error)
      return response.status(500).json({ message: 'Não foi possível carregar a configuração da loja.' })
    }
  }

export async function actualizarConfiguracaoAdmin(request, response) {
    const {
      nomeMarca, designacaoLegal, sobre, morada, referenciaLocalizacao,
      telefone, email, horarioAtendimento, codigoMoeda, regrasComerciais,
    } = request.body
    if (typeof nomeMarca !== 'string' || !nomeMarca.trim()) {
      return response.status(400).json({ message: 'O nome da loja é obrigatório.' })
    }
    try {
      const configuracao = await prisma.configuracaoLoja.upsert({
        where: { id: 1 },
        create: {
          id: 1,
          nomeMarca: nomeMarca.trim(),
          ...(designacaoLegal !== undefined ? { designacaoLegal } : {}),
          ...(sobre !== undefined ? { sobre } : {}),
          ...(morada !== undefined ? { morada } : {}),
          ...(referenciaLocalizacao !== undefined ? { referenciaLocalizacao } : {}),
          ...(telefone !== undefined ? { telefone } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(horarioAtendimento !== undefined ? { horarioAtendimento } : {}),
          ...(codigoMoeda !== undefined ? { codigoMoeda } : {}),
          ...(regrasComerciais !== undefined ? { regrasComerciais } : {}),
        },
        update: {
          nomeMarca: nomeMarca.trim(),
          ...(designacaoLegal !== undefined ? { designacaoLegal } : {}),
          ...(sobre !== undefined ? { sobre } : {}),
          ...(morada !== undefined ? { morada } : {}),
          ...(referenciaLocalizacao !== undefined ? { referenciaLocalizacao } : {}),
          ...(telefone !== undefined ? { telefone } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(horarioAtendimento !== undefined ? { horarioAtendimento } : {}),
          ...(codigoMoeda !== undefined ? { codigoMoeda } : {}),
          ...(regrasComerciais !== undefined ? { regrasComerciais } : {}),
        },
      })
      await prisma.registoAuditoria.create({
        data: {
          utilizadorAutorId: request.admin.id,
          accao: 'ACTUALIZAR_CONFIGURACAO_LOJA',
          tipoEntidade: 'configuracao_loja',
          idEntidade: '1',
          detalhes: { nomeMarca: configuracao.nomeMarca },
        },
      })
      return response.json({ configuracao })
    } catch (error) {
      console.error('Erro ao actualizar configuração administrativa:', error)
      return response.status(500).json({ message: 'Não foi possível actualizar a configuração da loja.' })
    }
  }

export async function actualizarPoliticaAdmin(request, response) {
    const politica = String(request.params.tipo || '').toUpperCase()
    const tiposPermitidos = ['PRIVACIDADE', 'TERMOS', 'ENTREGA', 'DEVOLUCAO', 'GARANTIA']
    const { titulo, conteudo } = request.body
    if (!tiposPermitidos.includes(politica) || typeof titulo !== 'string' || !titulo.trim() || typeof conteudo !== 'string' || !conteudo.trim()) {
      return response.status(400).json({ message: 'O tipo, título e conteúdo da política são obrigatórios.' })
    }
    try {
      const actual = await prisma.politicaLoja.findUnique({ where: { tipoPolitica: politica }, select: { versao: true } })
      const politicaGuardada = await prisma.politicaLoja.upsert({
        where: { tipoPolitica: politica },
        create: {
          tipoPolitica: politica,
          titulo: titulo.trim(),
          conteudo: conteudo.trim(),
          versao: 1,
          actualizadoPor: request.admin.id,
        },
        update: {
          titulo: titulo.trim(),
          conteudo: conteudo.trim(),
          versao: (actual?.versao || 0) + 1,
          actualizadoPor: request.admin.id,
        },
      })
      await prisma.registoAuditoria.create({
        data: {
          utilizadorAutorId: request.admin.id,
          accao: 'ACTUALIZAR_POLITICA',
          tipoEntidade: 'politica_loja',
          idEntidade: String(politicaGuardada.id),
          detalhes: { tipo: politica, versao: politicaGuardada.versao },
        },
      })
      return response.json({ politica: politicaGuardada })
    } catch (error) {
      console.error('Erro ao actualizar política administrativa:', error)
      return response.status(500).json({ message: 'Não foi possível actualizar a política.' })
  }
}

export async function listarTodosPagamentosAdmin(req, res) {
  try {
    const pagamentos = await prisma.formaPagamento.findMany({ orderBy: { id: 'asc' } })
    return res.json(pagamentos)
  } catch (_error) {
    return res.status(500).json({ message: 'Erro ao listar pagamentos.' })
  }
}

export async function alternarEstadoPagamentoAdmin(req, res) {
  try {
    const id = Number(req.params.id)
    const { activo } = req.body

    if (typeof activo !== 'boolean') return res.status(400).json({ message: 'O estado activo deve ser um booleano.' })

    const atualizado = await prisma.formaPagamento.update({
      where: { id },
      data: { activo }
    })
    return res.json({ message: 'Estado do pagamento atualizado.', pagamento: atualizado })
  } catch (_error) {
    return res.status(500).json({ message: 'Erro ao atualizar pagamento.' })
  }
}