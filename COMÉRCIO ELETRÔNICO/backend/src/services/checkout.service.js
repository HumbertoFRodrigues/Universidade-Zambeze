import { randomBytes, scryptSync } from 'node:crypto'
import { prisma } from '../lib/prisma.js'
import { ErroCheckout } from '../errors/ErroCheckout.js'
import { formatarDinheiro, paraCentavos } from '../utils/dinheiro.js'
import { descontoEscalao, descontoEscalaoCentavos, ivaIncluido } from './precos.js'
import { dadosFiscaisEncomenda } from './factura.service.js'
import {
  validarAceiteTermos,
  validarAtualizacaoEstadoEntrega,
  validarChaveIdempotencia,
  validarConsultaEstadoEntrega,
  validarDadosContacto,
  validarIdentidade,
  validarOpcaoEntrega,
} from '../validators/checkout.validator.js'

const incluirEncomenda = {
  itens: true,
  entrega: true,
}

async function obterContextoCheckout(client, dados, utilizadorSessao) {
  const identidade = validarIdentidade(dados, utilizadorSessao)
  const { zonaId, modalidadeId } = validarOpcaoEntrega(dados.zonaEntregaId, dados.modalidadeEntregaId)

  if (identidade.utilizadorId !== undefined) {
    const utilizador = await client.utilizador.findUnique({
      where: { id: identidade.utilizadorId },
      select: { id: true, activo: true },
    })
    if (!utilizador || !utilizador.activo) {
      throw new ErroCheckout(404, 'Utilizador não encontrado ou inactivo.')
    }
  }

  const [zona, modalidade, tarifa, carrinho, configuracao] = await Promise.all([
    client.zonaEntrega.findUnique({ where: { id: zonaId } }),
    client.modalidadeEntrega.findUnique({ where: { id: modalidadeId } }),
    client.tarifaFrete.findUnique({
      where: { zonaEntregaId_modalidadeEntregaId: { zonaEntregaId: zonaId, modalidadeEntregaId: modalidadeId } },
    }),
    client.carrinho.findUnique({
      where: identidade.utilizadorId !== undefined
        ? { utilizadorId: identidade.utilizadorId }
        : { tokenSessao: identidade.tokenSessao },
      include: {
        itens: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                codigo: true,
                categoriaId: true,
                preco: true,
                codigoMoeda: true,
                quantidadeStock: true,
                activo: true,
              },
            },
          },
        },
      },
    }),
    client.configuracaoLoja.findUnique({
      where: { id: 1 },
      select: { codigoMoeda: true, regrasComerciais: true, taxaIva: true },
    }),
  ])
  // Escalões de quantidade (regrasComerciais.atacado), os mesmos que a loja mostra.
  const escaloes = configuracao?.regrasComerciais?.atacado

  if (!zona?.activo) throw new ErroCheckout(422, 'A zona de entrega não existe ou está inactiva.')
  if (!modalidade?.activo) throw new ErroCheckout(422, 'A modalidade de entrega não existe ou está inactiva.')
  if (!tarifa?.activo) throw new ErroCheckout(422, 'Não existe uma tarifa activa para esta zona e modalidade.')
  if (!configuracao) throw new ErroCheckout(503, 'A moeda da loja ainda não está configurada.')
  if (!carrinho || carrinho.itens.length === 0) {
    throw new ErroCheckout(400, 'O carrinho não existe ou não contém produtos.')
  }

  const itensInvalidos = carrinho.itens.filter(({ produto, quantidade }) =>
    !produto.activo || quantidade < 1 || produto.quantidadeStock < quantidade)
  if (itensInvalidos.length > 0) {
    throw new ErroCheckout(409, 'O carrinho contém produtos inactivos ou quantidades sem stock suficiente.')
  }

  const moedas = new Set(carrinho.itens.map(({ produto }) => produto.codigoMoeda))
  if (moedas.size !== 1 || !moedas.has(configuracao.codigoMoeda)) {
    throw new ErroCheckout(409, 'A moeda dos produtos não corresponde à moeda configurada para a loja.')
  }

  const agora = new Date()
  const produtoIds = carrinho.itens.map(({ produtoId }) => produtoId)
  const categoriaIds = [...new Set(carrinho.itens
    .map(({ produto }) => produto.categoriaId)
    .filter(categoriaId => categoriaId !== null))]
  const promocoes = await client.promocao.findMany({
    where: {
      activo: true,
      inicioEm: { lte: agora },
      fimEm: { gt: agora },
      OR: [
        { categoriaId: { in: categoriaIds } },
        { produtos: { some: { produtoId: { in: produtoIds } } } },
      ],
    },
    include: { produtos: { select: { produtoId: true } } },
    orderBy: { id: 'asc' },
  })

  const itens = carrinho.itens.map(({ produtoId, quantidade, produto }) => {
    let melhorPromocao = null
    let maiorDesconto = 0
    const precoCentavos = paraCentavos(produto.preco)

    for (const promocao of promocoes) {
      const aplicaPorCategoria = promocao.categoriaId !== null &&
        promocao.categoriaId === produto.categoriaId
      const aplicaPorProduto = promocao.produtos.some(item => item.produtoId === produtoId)
      if (!aplicaPorCategoria && !aplicaPorProduto) continue

      const valorDesconto = paraCentavos(promocao.valorDesconto)
      const desconto = promocao.tipoDesconto === 'PERCENTAGEM'
        ? Math.round(precoCentavos * valorDesconto / 10000)
        : valorDesconto
      const descontoAplicado = Math.min(precoCentavos, Math.max(0, desconto))
      if (descontoAplicado > maiorDesconto) {
        maiorDesconto = descontoAplicado
        melhorPromocao = promocao
      }
    }

    // Escalão de quantidade sobre o preço já com promoção (ver services/precos.js).
    const escalao = descontoEscalao(escaloes, quantidade)
    const descontoEscalaoUnitario = descontoEscalaoCentavos(precoCentavos - maiorDesconto, quantidade, escaloes)
    const rotuloEscalao = descontoEscalaoUnitario > 0 ? `Desconto por quantidade (-${Math.round(escalao * 100)}%)` : null
    const nomePromocao = [melhorPromocao?.nome, rotuloEscalao].filter(Boolean).join(' + ').slice(0, 150) || null

    return {
      produtoId,
      nomeProduto: produto.nome,
      codigoProduto: produto.codigo ?? produtoId,
      quantidade,
      precoUnitarioCentavos: precoCentavos,
      descontoUnitarioCentavos: maiorDesconto + descontoEscalaoUnitario,
      promocaoId: melhorPromocao?.id ?? null,
      nomePromocao,
    }
  })

  const subtotalCentavos = itens.reduce((total, item) =>
    total + item.precoUnitarioCentavos * item.quantidade, 0)
  const descontoCentavos = itens.reduce((total, item) =>
    total + item.descontoUnitarioCentavos * item.quantidade, 0)
  const freteCentavos = paraCentavos(tarifa.valor)

  return {
    identidade,
    zona,
    modalidade,
    tarifa,
    carrinho,
    itens,
    subtotalCentavos,
    descontoCentavos,
    freteCentavos,
    totalCentavos: subtotalCentavos - descontoCentavos + freteCentavos,
    taxaIva: Number(configuracao.taxaIva),
    codigoMoeda: configuracao.codigoMoeda,
  }
}

function formatarCotacao(contexto) {
  return {
    zona: { id: contexto.zona.id, nome: contexto.zona.nome },
    modalidade: {
      id: contexto.modalidade.id,
      nome: contexto.modalidade.nome,
      levantamentoLoja: contexto.modalidade.levantamentoLoja,
    },
    prazoDias: contexto.tarifa.prazoDias,
    itens: contexto.itens.map(item => ({
      produtoId: item.produtoId,
      nome: item.nomeProduto,
      quantidade: item.quantidade,
      precoUnitario: formatarDinheiro(item.precoUnitarioCentavos),
      descontoUnitario: formatarDinheiro(item.descontoUnitarioCentavos),
      promocao: item.nomePromocao,
      subtotal: formatarDinheiro(
        (item.precoUnitarioCentavos - item.descontoUnitarioCentavos) * item.quantidade,
      ),
    })),
    subtotal: formatarDinheiro(contexto.subtotalCentavos),
    desconto: formatarDinheiro(contexto.descontoCentavos),
    frete: formatarDinheiro(contexto.freteCentavos),
    total: formatarDinheiro(contexto.totalCentavos),
    // Os preços incluem IVA: mostra-se o IVA contido no total.
    taxaIva: contexto.taxaIva,
    ivaIncluido: formatarDinheiro(ivaIncluido(contexto.totalCentavos, contexto.taxaIva).ivaCentavos),
    codigoMoeda: contexto.codigoMoeda,
  }
}

function identidadeCorresponde(encomenda, dados, identidade) {
  const email = dados.emailContacto.trim().toLowerCase()
  if (encomenda.utilizadorId !== identidade.clienteId ||
      encomenda.emailContacto.toLowerCase() !== email ||
      encomenda.telefoneContacto !== dados.telefoneContacto.trim() ||
      encomenda.zonaEntregaId !== Number(dados.zonaEntregaId) ||
      encomenda.modalidadeEntregaId !== Number(dados.modalidadeEntregaId)) {
    throw new ErroCheckout(409, 'A chave de idempotência já foi usada para outro pedido.')
  }
}

async function obterEncomendaIdempotente(chave, dados, identidade) {
  const existente = await prisma.encomenda.findUnique({
    where: { chaveIdempotencia: chave },
    include: incluirEncomenda,
  })
  if (!existente) return null
  identidadeCorresponde(existente, dados, identidade)
  return existente
}

export async function listarOpcoesEntrega() {
  const [tarifas, configuracao] = await Promise.all([
    prisma.tarifaFrete.findMany({
      where: {
        activo: true,
        zonaEntrega: { activo: true },
        modalidadeEntrega: { activo: true },
      },
      include: {
        zonaEntrega: { select: { id: true, nome: true } },
        modalidadeEntrega: { select: { id: true, nome: true, levantamentoLoja: true } },
      },
      orderBy: [
        { zonaEntrega: { nome: 'asc' } },
        { modalidadeEntrega: { nome: 'asc' } },
      ],
    }),
    prisma.configuracaoLoja.findUnique({
      where: { id: 1 },
      select: { codigoMoeda: true },
    }),
  ])
  if (!configuracao) {
    throw new ErroCheckout(503, 'A moeda da loja ainda não está configurada.')
  }

  return {
    opcoes: tarifas.map(tarifa => ({
      zona: tarifa.zonaEntrega,
      modalidade: tarifa.modalidadeEntrega,
      frete: formatarDinheiro(paraCentavos(tarifa.valor)),
      prazoDias: tarifa.prazoDias,
      codigoMoeda: configuracao.codigoMoeda,
    })),
  }
}

export async function calcularFrete(dados, utilizadorSessao = null) {
  return formatarCotacao(await obterContextoCheckout(prisma, dados, utilizadorSessao))
}

async function criarContaConvidado(encomenda) {
  const email = encomenda.emailContacto
  const existente = await prisma.utilizador.findUnique({ where: { email } })
  if (existente) return null

  const palavraPasse = randomBytes(4).toString('hex') + 'Aa1!'
  const sal = randomBytes(16).toString('hex')
  const chave = scryptSync(palavraPasse, Buffer.from(sal, 'hex'), 64, { N: 16384, r: 8, p: 1 }).toString('hex')

  const utilizador = await prisma.utilizador.create({
    data: {
      nome: encomenda.nomeContacto,
      email,
      telefone: encomenda.telefoneContacto,
      hashPalavraPasse: `scrypt$16384$8$1$${sal}$${chave}`,
      perfil: 'CLIENTE',
      activo: true,
      privacidadeAceiteEm: new Date(),
    },
  })

  await prisma.encomenda.update({
    where: { id: encomenda.id },
    data: { utilizadorId: utilizador.id },
  })

  return { email, palavraPasse }
}

export async function confirmarCheckout(dados, chaveIdempotencia, utilizadorSessao = null) {
  const chave = validarChaveIdempotencia(chaveIdempotencia)
  const identidade = validarIdentidade(dados, utilizadorSessao)
  validarDadosContacto(dados)
  validarAceiteTermos(dados)

  const existente = await obterEncomendaIdempotente(chave, dados, identidade)
  if (existente) return { encomenda: existente, repetida: true }

  try {
    const encomenda = await prisma.$transaction(async transaction => {
      const contexto = await obterContextoCheckout(transaction, dados, utilizadorSessao)
      const agora = new Date()
      const politicaTermos = await transaction.politicaLoja.findUnique({
        where: { tipoPolitica: 'TERMOS' },
        select: { versao: true },
      })

      for (const item of contexto.itens) {
        const stockActualizado = await transaction.produto.updateMany({
          where: {
            id: item.produtoId,
            activo: true,
            quantidadeStock: { gte: item.quantidade },
          },
          data: { quantidadeStock: { decrement: item.quantidade } },
        })
        if (stockActualizado.count !== 1) {
          throw new ErroCheckout(409, `Stock insuficiente para o produto ${item.nomeProduto}.`)
        }
      }

      // IVA incluído no total e dados fiscais do particular (sem NUIT; morada de entrega).
      const fiscal = await dadosFiscaisEncomenda(transaction, contexto.totalCentavos, {
        nome: dados.nomeContacto.trim(),
        morada: [dados.entregaLinhaEndereco, dados.entregaCidade, dados.entregaProvincia].map(valor => valor.trim()).join(', '),
      })

      const criada = await transaction.encomenda.create({
        data: {
          ...fiscal,
          codigoEncomenda: `ENC-${randomBytes(8).toString('hex').toUpperCase()}`,
          chaveIdempotencia: chave,
          // Dono da encomenda: o utilizador da sessão (null para convidados).
          utilizadorId: contexto.identidade.clienteId,
          estado: 'REGISTADA',
          nomeContacto: dados.nomeContacto.trim(),
          emailContacto: dados.emailContacto.trim().toLowerCase(),
          telefoneContacto: dados.telefoneContacto.trim(),
          entregaNomeDestinatario: dados.entregaNomeDestinatario.trim(),
          entregaTelefone: dados.entregaTelefone.trim(),
          entregaLinhaEndereco: dados.entregaLinhaEndereco.trim(),
          entregaCidade: dados.entregaCidade.trim(),
          entregaProvincia: dados.entregaProvincia.trim(),
          entregaPontoReferencia: dados.entregaPontoReferencia?.trim() || null,
          zonaEntregaId: contexto.zona.id,
          modalidadeEntregaId: contexto.modalidade.id,
          valorSubtotal: formatarDinheiro(contexto.subtotalCentavos),
          totalDesconto: formatarDinheiro(contexto.descontoCentavos),
          valorFrete: formatarDinheiro(contexto.freteCentavos),
          valorTotal: formatarDinheiro(contexto.totalCentavos),
          termosAceitesEm: agora,
          versaoTermos: politicaTermos?.versao ?? null,
          itens: {
            create: contexto.itens.map(item => ({
              produtoId: item.produtoId,
              nomeProduto: item.nomeProduto,
              codigoProduto: item.codigoProduto,
              quantidade: item.quantidade,
              precoUnitario: formatarDinheiro(item.precoUnitarioCentavos),
              descontoUnitario: formatarDinheiro(item.descontoUnitarioCentavos),
              promocaoId: item.promocaoId,
              nomePromocao: item.nomePromocao,
            })),
          },
          historicoEstados: {
            create: {
              estadoNovo: 'REGISTADA',
              observacao: 'Encomenda confirmada pelo checkout.',
            },
          },
          entrega: { create: { estado: 'POR_EXPEDIR' } },
        },
        include: { itens: true },
      })

      for (const item of contexto.itens) {
        const produto = await transaction.produto.findUniqueOrThrow({
          where: { id: item.produtoId },
          select: { quantidadeStock: true },
        })
        await transaction.movimentoStock.create({
          data: {
            produtoId: item.produtoId,
            tipoMovimento: 'VENDA',
            variacaoQuantidade: -item.quantidade,
            stockApos: produto.quantidadeStock,
            itemEncomendaId: criada.itens.find(linha => linha.produtoId === item.produtoId).id,
          },
        })
      }

      await transaction.itemCarrinho.deleteMany({
        where: { carrinhoId: contexto.carrinho.id },
      })

      return transaction.encomenda.findUniqueOrThrow({
        where: { id: criada.id },
        include: incluirEncomenda,
      })
    })

    let contaCriada = null
    if (!utilizadorSessao) {
      try {
        contaCriada = await criarContaConvidado(encomenda)
      } catch (_error) {
        // Email já existe ou erro temporário: não bloqueia a encomenda.
      }
    }

    return { encomenda, repetida: false, contaCriada }
  } catch (error) {
    if (error.code === 'P2002' && chaveIdempotencia) {
      try {
        const existente = await obterEncomendaIdempotente(chave, dados, identidade)
        if (existente) return { encomenda: existente, repetida: true }
      } catch (idempotencyError) {
        if (idempotencyError instanceof ErroCheckout) throw idempotencyError
        console.error('Erro ao verificar checkout idempotente:', idempotencyError)
        throw new ErroCheckout(500, 'Não foi possível verificar a encomenda existente.')
      }
    }
    throw error
  }
}

export async function obterEstadoEntrega(codigoEncomenda, emailContacto) {
  const { codigo, email } = validarConsultaEstadoEntrega(codigoEncomenda, emailContacto)
  const encomenda = await prisma.encomenda.findUnique({
    where: { codigoEncomenda: codigo },
    select: {
      codigoEncomenda: true,
      emailContacto: true,
      estado: true,
      entrega: {
        select: {
          estado: true,
          expedidoEm: true,
          entregueEm: true,
          recebidoPor: true,
          observacao: true,
        },
      },
    },
  })
  if (!encomenda || encomenda.emailContacto.toLowerCase() !== email.toLowerCase()) {
    throw new ErroCheckout(404, 'Encomenda não encontrada.')
  }

  return {
    codigoEncomenda: encomenda.codigoEncomenda,
    estado: encomenda.estado,
    entrega: encomenda.entrega,
  }
}

export async function atualizarEstadoEntrega(encomendaId, dados, adminId) {
  const actualizacao = validarAtualizacaoEstadoEntrega(encomendaId, dados)
  const { estado, recebidoPor, observacao } = actualizacao

  return prisma.$transaction(async transaction => {
    const encomenda = await transaction.encomenda.findUnique({
      where: { id: actualizacao.encomendaId },
      include: { entrega: true, modalidadeEntrega: true },
    })
    if (!encomenda?.entrega) throw new ErroCheckout(404, 'Entrega não encontrada.')
    if (encomenda.estado === 'CANCELADA') {
      throw new ErroCheckout(409, 'Não é possível actualizar a entrega de uma encomenda cancelada.')
    }

    const permitidas = {
      POR_EXPEDIR: ['EM_TRANSPORTE', 'NAO_ENTREGUE'],
      EM_TRANSPORTE: ['ENTREGUE', 'NAO_ENTREGUE'],
      NAO_ENTREGUE: ['EM_TRANSPORTE'],
      ENTREGUE: [],
    }
    if (estado === 'ENTREGUE' && encomenda.modalidadeEntrega.levantamentoLoja &&
        encomenda.entrega.estado === 'POR_EXPEDIR') {
      permitidas.POR_EXPEDIR.push('ENTREGUE')
    }
    if (!permitidas[encomenda.entrega.estado].includes(estado)) {
      throw new ErroCheckout(409, `Transição inválida: ${encomenda.entrega.estado} para ${estado}.`)
    }

    const agora = new Date()
    const entrega = await transaction.entrega.update({
      where: { id: encomenda.entrega.id },
      data: {
        estado,
        expedidoEm: estado === 'EM_TRANSPORTE'
          ? (encomenda.entrega.expedidoEm ?? agora)
          : encomenda.entrega.expedidoEm,
        entregueEm: estado === 'ENTREGUE' ? agora : encomenda.entrega.entregueEm,
        recebidoPor: estado === 'ENTREGUE' ? recebidoPor.trim() : encomenda.entrega.recebidoPor,
        observacao: observacao?.trim() || null,
      },
    })

    if (estado === 'EM_TRANSPORTE' && encomenda.estado === 'REGISTADA') {
      await transaction.encomenda.update({
        where: { id: encomenda.id },
        data: { estado: 'EM_PROCESSAMENTO' },
      })
      await transaction.historicoEstadoEncomenda.create({
        data: {
          encomendaId: encomenda.id,
          estadoAnterior: 'REGISTADA',
          estadoNovo: 'EM_PROCESSAMENTO',
          alteradoPor: adminId,
          observacao: 'Encomenda entregue ao transportador.',
        },
      })
    }

    if (estado === 'ENTREGUE' && encomenda.estado !== 'CONCLUIDA') {
      await transaction.encomenda.update({
        where: { id: encomenda.id },
        data: { estado: 'CONCLUIDA' },
      })
      await transaction.historicoEstadoEncomenda.create({
        data: {
          encomendaId: encomenda.id,
          estadoAnterior: encomenda.estado,
          estadoNovo: 'CONCLUIDA',
          alteradoPor: adminId,
          observacao: 'Encomenda concluída após confirmação de entrega.',
        },
      })
    }

    await transaction.registoAuditoria.create({
      data: {
        utilizadorAutorId: adminId,
        accao: 'ACTUALIZAR_ESTADO_ENTREGA',
        tipoEntidade: 'entrega',
        idEntidade: String(entrega.id),
        detalhes: {
          estadoAnterior: encomenda.entrega.estado,
          estadoNovo: estado,
          observacao: observacao?.trim() || null,
        },
      },
    })

    return entrega
  })
}
