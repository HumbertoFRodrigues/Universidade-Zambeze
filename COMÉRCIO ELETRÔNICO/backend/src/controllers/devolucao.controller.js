import { prisma } from '../lib/prisma.js'
import { consultarEncomenda } from '../services/encomenda.service.js'
import { validarDecisaoDevolucao, validarPedidoDevolucao } from '../validators/devolucao.validator.js'

function gerarCodigoDevolucao() {
  return `DEV-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`
}

// ==========================================
// ÁREA DO CLIENTE (PÚBLICA)
// ==========================================

export async function solicitarDevolucao(req, res) {
  try {
    const { codigoEncomenda, emailContacto, descricaoMotivo, tipoMotivo } = req.body ?? {}
    if (!codigoEncomenda) {
      return res.status(400).json({ message: 'O código da encomenda é obrigatório.' })
    }

    // Email de contacto ou sessão do dono da encomenda (404 se não corresponder).
    const encomendaBase = await consultarEncomenda(codigoEncomenda, emailContacto, req.utilizador ?? null)
    const [encomenda, configuracao] = await Promise.all([
      prisma.encomenda.findUnique({
        where: { id: encomendaBase.id },
        include: {
          itens: { select: { id: true, quantidade: true, quantidadeDevolvida: true } },
          entrega: { select: { entregueEm: true } },
          devolucoes: { where: { estado: { notIn: ['REJEITADA', 'REEMBOLSADA'] } }, select: { id: true } },
        },
      }),
      prisma.configuracaoLoja.findUnique({ where: { id: 1 }, select: { regrasComerciais: true } }),
    ])

    const itens = validarPedidoDevolucao(req.body, encomenda, {
      prazoDias: configuracao?.regrasComerciais?.prazoDevolucaoDias,
    })

    if (encomenda.devolucoes.length > 0) {
      return res.status(409).json({ message: 'Já existe um pedido de devolução em curso para esta encomenda.' })
    }

    // Criar a devolução e os itens de devolução numa transação
    const novaDevolucao = await prisma.$transaction(async (tx) => {
      const devolucao = await tx.devolucao.create({
        data: {
          codigoDevolucao: gerarCodigoDevolucao(),
          encomendaId: encomenda.id,
          tipoMotivo,
          descricaoMotivo: typeof descricaoMotivo === 'string' && descricaoMotivo.trim() ? descricaoMotivo.trim() : null,
          estado: 'SOLICITADA'
        }
      })

      await tx.itemDevolucao.createMany({
        data: itens.map(item => ({ ...item, devolucaoId: devolucao.id, resultadoVerificacao: 'PENDENTE' })),
      })

      // A quantidade fica reservada desde o pedido; é libertada se a devolução for rejeitada.
      for (const item of itens) {
        await tx.itemEncomenda.update({
          where: { id: item.itemEncomendaId },
          data: { quantidadeDevolvida: { increment: item.quantidade } },
        })
      }

      return devolucao
    })

    return res.status(201).json({ message: 'Pedido de devolução registado com sucesso.', devolucao: novaDevolucao })
  } catch (error) {
    if (Number.isInteger(error?.status) && error.status < 500) return res.status(error.status).json({ message: error.message })
    console.error('Erro ao solicitar devolução:', error)
    return res.status(500).json({ message: 'Erro interno ao processar o pedido de devolução.' })
  }
}


// ==========================================
// ÁREA ADMINISTRATIVA (PROTEGIDA)
// ==========================================

export async function listarDevolucoesAdmin(req, res) {
  try {
    const devolucoes = await prisma.devolucao.findMany({
      include: {
        encomenda: { select: { codigoEncomenda: true, nomeContacto: true } },
        itens: { include: { itemEncomenda: { select: { nomeProduto: true, precoUnitario: true } } } },
        responsavel: { select: { nome: true } }
      },
      orderBy: { criadoEm: 'desc' }
    })
    return res.status(200).json(devolucoes)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro ao listar devoluções.' })
  }
}

export async function analisarDevolucaoAdmin(req, res) {
  try {
    const { id } = req.params
    let decisao, justificacaoDecisao
    try {
      ({ decisao, justificacaoDecisao } = validarDecisaoDevolucao(req.body))
    } catch (erro) {
      return res.status(erro.status).json({ message: erro.message })
    }

    const devolucao = await prisma.devolucao.findUnique({ where: { id: Number(id) } })
    if (!devolucao) return res.status(404).json({ message: 'Devolução não encontrada.' })

    if (devolucao.estado !== 'SOLICITADA' && devolucao.estado !== 'EM_ANALISE') {
      return res.status(400).json({ message: `A devolução já se encontra no estado ${devolucao.estado}.` })
    }

    const atualizada = await prisma.$transaction(async tx => {
      if (decisao === 'REJEITADA') {
        const itens = await tx.itemDevolucao.findMany({ where: { devolucaoId: devolucao.id } })
        for (const item of itens) {
          await tx.itemEncomenda.update({
            where: { id: item.itemEncomendaId },
            data: { quantidadeDevolvida: { decrement: item.quantidade } },
          })
        }
      }
      return tx.devolucao.update({
        where: { id: devolucao.id },
        data: { estado: decisao, justificacaoDecisao, decididoPor: req.admin.id, decididoEm: new Date() },
      })
    })

    return res.status(200).json({ message: `Devolução ${decisao.toLowerCase()} com sucesso.`, devolucao: atualizada })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro ao analisar devolução.' })
  }
}

export async function registarRececaoProdutoAdmin(req, res) {
  try {
    const { id } = req.params
    const devolucao = await prisma.devolucao.findUnique({ where: { id: Number(id) } })
    
    if (!devolucao) return res.status(404).json({ message: 'Devolução não encontrada.' })
    if (devolucao.estado !== 'APROVADA') return res.status(400).json({ message: 'Apenas devoluções APROVADAS podem ser recebidas.' })

    const atualizada = await prisma.$transaction(async (tx) => {
      // Regista a receção
      const dev = await tx.devolucao.update({
        where: { id: devolucao.id },
        data: { estado: 'PRODUTO_RECEBIDO', recebidoEm: new Date() }
      })

      // Assume os itens como REVENDAVEL por defeito (pode ser expandido no futuro para escolha manual)
      await tx.itemDevolucao.updateMany({
        where: { devolucaoId: dev.id },
        data: { resultadoVerificacao: 'REVENDAVEL' }
      })

      return dev
    })

    return res.status(200).json({ message: 'Receção do produto confirmada e estado atualizado para PRODUTO_RECEBIDO.', devolucao: atualizada })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Erro ao registar receção do produto.' })
  }
}

export async function processarReembolsoSimuladoAdmin(req, res) {
  try {
    const { id } = req.params
    const devolucao = await prisma.devolucao.findUnique({ 
      where: { id: Number(id) },
      include: { 
        itens: { include: { itemEncomenda: true } },
        encomenda: {
          include: {
            pagamentos: { where: { estado: 'CONFIRMADO' } },
            itens: { select: { quantidade: true, quantidadeDevolvida: true } },
          },
        },
      }
    })
    
    if (!devolucao) return res.status(404).json({ message: 'Devolução não encontrada.' })
    if (devolucao.estado === 'REEMBOLSADA') return res.status(409).json({ message: 'Esta devolução já foi reembolsada.' })
    if (devolucao.estado !== 'PRODUTO_RECEBIDO') return res.status(400).json({ message: 'O produto precisa ser recebido antes do reembolso.' })

    const pagamentoConfirmado = devolucao.encomenda.pagamentos[0]
    if (!pagamentoConfirmado) return res.status(400).json({ message: 'Não existe nenhum pagamento confirmado para esta encomenda.' })

    // Calcular o valor a reembolsar com base nos itens devolvidos
    let valorReembolsar = 0
    for (const item of devolucao.itens) {
      const precoFinalItem = Number(item.itemEncomenda.precoUnitario) - Number(item.itemEncomenda.descontoUnitario)
      valorReembolsar += precoFinalItem * item.quantidade
    }
    const produtosReembolsados = devolucao.itens.map(item => `${item.quantidade} × ${item.itemEncomenda.nomeProduto}`).join(', ')

    await prisma.$transaction(async (tx) => {
      // 1. Atualizar a devolução para REEMBOLSADA
      await tx.devolucao.update({
        where: { id: devolucao.id },
        data: { estado: 'REEMBOLSADA' }
      })

      // 2. Reembolso simulado associado ao pagamento (reaproveita um pedido pendente ou falhado anterior)
      const anterior = await tx.reembolso.findUnique({ where: { devolucaoId: devolucao.id } })
      if (anterior?.estado === 'CONCLUIDO') throw { status: 409, message: 'Esta devolução já foi reembolsada.' }
      await tx.reembolso.upsert({
        where: { devolucaoId: devolucao.id },
        update: {
          pagamentoId: pagamentoConfirmado.id, valor: valorReembolsar, estado: 'CONCLUIDO',
          processadoPor: req.admin.id, processadoEm: new Date(),
        },
        create: {
          devolucaoId: devolucao.id,
          pagamentoId: pagamentoConfirmado.id,
          referenciaOperacao: `REEMB-${Date.now()}-${devolucao.id}`,
          valor: valorReembolsar,
          estado: 'CONCLUIDO', // Sendo simulado, assume-se concluído imediatamente
          simulado: true,
          processadoPor: req.admin.id,
          processadoEm: new Date()
        }
      })

      // 3. Valor reembolsado acumula no pagamento. Só um reembolso integral (todos os produtos
      //    devolvidos) marca o pagamento como REEMBOLSADO e cancela a encomenda; um reembolso
      //    parcial mantém o pagamento confirmado e a encomenda no estado em que estava.
      const integral = devolucao.encomenda.itens.every(item => (item.quantidadeDevolvida ?? 0) >= item.quantidade)
      await tx.pagamento.update({
        where: { id: pagamentoConfirmado.id },
        data: {
          estado: integral ? 'REEMBOLSADO' : 'CONFIRMADO',
          valorReembolsado: Number(pagamentoConfirmado.valorReembolsado) + valorReembolsar,
        }
      })

      if (integral) {
        await tx.encomenda.update({
          where: { id: devolucao.encomendaId },
          data: { estado: 'CANCELADA' }
        })
      }

      await tx.historicoEstadoEncomenda.create({
        data: {
          encomendaId: devolucao.encomendaId,
          estadoAnterior: devolucao.encomenda.estado,
          estadoNovo: integral ? 'CANCELADA' : devolucao.encomenda.estado,
          alteradoPor: req.admin.id,
          observacao: integral
            ? `Cancelada via devolução de todos os produtos. Reembolso: ${valorReembolsar.toFixed(2)} MZN.`
            : `Reembolso parcial de ${valorReembolsar.toFixed(2)} MZN (${produtosReembolsados}). Os restantes produtos continuam pagos.`,
        }
      })

      // 6. Reposição de Stock para itens Revendáveis
      for (const item of devolucao.itens) {
        const jaReposto = await tx.movimentoStock.findFirst({
          where: { itemDevolucaoId: item.id, tipoMovimento: 'REPOSICAO_DEVOLUCAO' }, select: { id: true },
        })
        if (item.resultadoVerificacao === 'REVENDAVEL' && !jaReposto) {
          const produto = await tx.produto.findUnique({ where: { id: item.itemEncomenda.produtoId } })
          if (produto) {
            const novoStock = produto.quantidadeStock + item.quantidade
            await tx.produto.update({
              where: { id: produto.id },
              data: { quantidadeStock: novoStock }
            })
            
            await tx.movimentoStock.create({
              data: {
                produtoId: produto.id,
                tipoMovimento: 'REPOSICAO_DEVOLUCAO', // Conforme o Enum
                variacaoQuantidade: item.quantidade,
                stockApos: novoStock,
                itemDevolucaoId: item.id,
                motivo: 'Reposição automática após devolução e reembolso simulado.',
                criadoPor: req.admin.id
              }
            })
          }
        }
      }
    })

    return res.status(200).json({ message: `Reembolso de ${valorReembolsar.toFixed(2)} MZN processado (simulado) para: ${produtosReembolsados}.` })
  } catch (error) {
    if (Number.isInteger(error?.status) && error.status < 500) return res.status(error.status).json({ message: error.message })
    console.error(error)
    return res.status(500).json({ message: 'Erro ao processar o reembolso.' })
  }
}