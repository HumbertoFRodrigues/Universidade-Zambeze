import { prisma } from '../lib/prisma.js'

// AT14: Máquina de estados - impede transições inválidas
const TRANSICOES_PERMITIDAS = {
  REGISTADA: ['PAGA', 'CANCELADA'],
  PAGA: ['EM_PROCESSAMENTO', 'CANCELADA'],
  EM_PROCESSAMENTO: ['EXPEDIDA', 'CANCELADA'],
  EXPEDIDA: ['ENTREGUE'],
  ENTREGUE: [],
  CANCELADA: []
}

// Acesso: email de contacto da encomenda, ou sessão do cliente dono da encomenda.
// Sem nenhum dos dois, a encomenda (com dados pessoais) não é devolvida.
export async function consultarEncomenda(codigo, email, utilizador = null) {
  if (!codigo) throw { status: 400, message: 'Código da encomenda é obrigatório.' }
  const temEmail = typeof email === 'string' && email.trim().length > 0
  if (!temEmail && !utilizador) throw { status: 400, message: 'Indique o e-mail usado na encomenda.' }

  // CORREÇÃO: O campo no schema chama-se 'codigoEncomenda' e não 'codigo'
  const encomenda = await prisma.encomenda.findUnique({
    where: { codigoEncomenda: codigo },
    include: {
      // O slug permite ligar cada produto à sua página (por exemplo, para o avaliar).
      itens: { include: { produto: { select: { slug: true } } } },
      entrega: true,
      factura: { select: { numero: true, emitidaEm: true } }
    }
  })

  // 2. Verifica se a encomenda existe
  if (!encomenda) {
    throw { status: 404, message: 'Encomenda não encontrada ou credenciais inválidas.' }
  }

  // 3. AT14: Validação de segurança: o e-mail tem de corresponder, ou a encomenda é da conta da sessão.
  const daConta = utilizador && encomenda.utilizadorId === utilizador.id
  if (temEmail || !daConta) {
    if (!temEmail) throw { status: 404, message: 'Encomenda não encontrada ou credenciais inválidas.' }
    const emailFormatado = email.trim().toLowerCase()
    // Garantir que a comparação não falha por diferenças de maiúsculas/minúsculas
    if (!encomenda.emailContacto || encomenda.emailContacto.toLowerCase() !== emailFormatado) {
      throw { status: 404, message: 'Encomenda não encontrada ou credenciais inválidas.' }
    }
  }

  return encomenda
}

export async function cancelarEncomenda(codigo, email, utilizador = null) {
  const encomenda = await consultarEncomenda(codigo, email, utilizador)

  // AT14: Rejeitar transições inválidas (ex: cancelar algo já entregue ou já cancelado)
  if (!TRANSICOES_PERMITIDAS[encomenda.estado]?.includes('CANCELADA')) {
    throw { status: 400, message: `Transição rejeitada: Não é possível cancelar uma encomenda no estado ${encomenda.estado}.` }
  }

  await prisma.$transaction(async (tx) => {
    // 1. Atualizar o estado da encomenda principal
    await tx.encomenda.update({
      where: { id: encomenda.id },
      data: {
        estado: 'CANCELADA',
        actualizadoEm: new Date()
      }
    })

    // 2. AT14: Reposição de stock e registo de movimentos
    for (const item of encomenda.itens) {
      const produto = await tx.produto.findUnique({ where: { id: item.produtoId } })
      
      // CORREÇÃO: No JS o Prisma mapeou para quantidadeStock (camelCase)
      const novoStock = produto.quantidadeStock + item.quantidade

      await tx.produto.update({
        where: { id: item.produtoId },
        data: { quantidadeStock: novoStock }
      })

      // CORREÇÃO: Respeitar os CHECK constraints estritos da base de dados PostgreSQL
      await tx.movimentoStock.create({
        data: {
          produtoId: item.produtoId,
          tipoMovimento: 'REPOSICAO_CANCELAMENTO', // Exigido pelo PostgreSQL para devoluções
          variacaoQuantidade: item.quantidade,     // No schema é variacaoQuantidade e não quantidade
          stockApos: novoStock,
          itemEncomendaId: item.id                 // Exigido para cruzar dados com a venda original
        }
      })
    }

    // 3. AT14: Registo do histórico de estados na auditoria geral
    await tx.registoAuditoria.create({
      data: {
        accao: 'ALTERACAO_ESTADO_ENCOMENDA',
        tipoEntidade: 'encomenda',
        idEntidade: String(encomenda.id),
        detalhes: { de: encomenda.estado, para: 'CANCELADA', motivo: 'Cancelamento efetuado pelo cliente.' }
      }
    })

    // 4. AT14: Registo obrigatório no Histórico de Estado da Encomenda
    await tx.historicoEstadoEncomenda.create({
      data: {
        encomendaId: encomenda.id,
        estadoAnterior: encomenda.estado,
        estadoNovo: 'CANCELADA',
        observacao: 'Cancelamento efetuado pelo cliente com reposição de stock.'
      }
    })
  })

  return { message: 'Encomenda cancelada com sucesso. O stock foi totalmente reposto.' }
}