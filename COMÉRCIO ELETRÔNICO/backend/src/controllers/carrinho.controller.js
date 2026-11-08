import { prisma } from '../lib/prisma.js'
import { ErroCheckout } from '../errors/ErroCheckout.js'
import { validarIdentidade } from '../validators/checkout.validator.js'

// Carrinho do pedido: token anónimo do navegador ou conta da sessão (nunca um utilizadorId
// enviado pelo cliente sem sessão correspondente).
function identidadeDoPedido(request, origem) {
  return validarIdentidade(origem ?? {}, request.utilizador ?? null)
}

function quantidadeValida(valor) {
  const quantidade = Number(valor)
  return Number.isSafeInteger(quantidade) && quantidade >= 1 && quantidade <= 9999 ? quantidade : null
}

function responderErro(response, error, mensagem) {
  if (error instanceof ErroCheckout) return response.status(error.status).json({ message: error.message })
  console.error(mensagem, error)
  return response.status(500).json({ message: mensagem })
}

// Só devolve o item se pertencer ao carrinho de quem faz o pedido.
async function itemDoPedido(request, itemId, origem) {
  const identidade = identidadeDoPedido(request, origem)
  const id = Number(itemId)
  if (!Number.isSafeInteger(id) || id < 0) throw new ErroCheckout(400, 'Item inválido.')
  const item = await prisma.itemCarrinho.findUnique({
    where: { id },
    include: { produto: true, carrinho: { select: { utilizadorId: true, tokenSessao: true } } },
  })
  const dono = identidade.tokenSessao !== undefined
    ? item?.carrinho.tokenSessao === identidade.tokenSessao
    : item?.carrinho.utilizadorId === identidade.utilizadorId
  if (!item || !dono) throw new ErroCheckout(404, 'Item não encontrado no carrinho.')
  return item
}

// Função auxiliar para obter ou criar o carrinho ativo do utilizador ou da sessão
async function obterOuCriarCarrinho({ utilizadorId, tokenSessao }) {
  if (utilizadorId) {
    let carrinho = await prisma.carrinho.findUnique({
      where: { utilizadorId: Number(utilizadorId) },
      include: {
        itens: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                slug: true,
                preco: true,
                codigoMoeda: true,
                quantidadeStock: true,
                activo: true,
                imagens: { where: { principal: true }, take: 1, select: { url: true } },
              },
            },
          },
        },
      },
    })

    if (!carrinho) {
      carrinho = await prisma.carrinho.create({
        data: { utilizadorId: Number(utilizadorId) },
        include: { itens: { include: { produto: { include: { imagens: { where: { principal: true }, take: 1 } } } } } },
      })
    }
    return carrinho
  }

  if (tokenSessao) {
    let carrinho = await prisma.carrinho.findUnique({
      where: { tokenSessao },
      include: {
        itens: {
          include: {
            produto: {
              select: {
                id: true,
                nome: true,
                slug: true,
                preco: true,
                codigoMoeda: true,
                quantidadeStock: true,
                activo: true,
                imagens: { where: { principal: true }, take: 1, select: { url: true } },
              },
            },
          },
        },
      },
    })

    if (!carrinho) {
      carrinho = await prisma.carrinho.create({
        data: { tokenSessao },
        include: { itens: { include: { produto: { include: { imagens: { where: { principal: true }, take: 1 } } } } } },
      })
    }
    return carrinho
  }

  throw new Error('Identificação de utilizador ou sessão em falta.')
}

// 1. Consultar Carrinho e Subtotais
export async function consultarCarrinho(request, response) {
  try {
    const carrinho = await obterOuCriarCarrinho(identidadeDoPedido(request, request.query))

    let totalParcial = 0
    const itensFormatados = carrinho.itens.map(item => {
      const precoUnitario = Number(item.produto.preco)
      const subtotal = precoUnitario * item.quantidade
      totalParcial += subtotal

      return {
        id: item.id,
        produtoId: item.produtoId,
        quantidade: item.quantidade,
        produto: {
          nome: item.produto.nome,
          slug: item.produto.slug,
          preco: item.produto.preco,
          codigoMoeda: item.produto.codigoMoeda,
          ativo: item.produto.activo,
          stockDisponivel: item.produto.quantidadeStock > 0,
          imagemPrincipal: item.produto.imagens[0]?.url || null,
        },
        subtotal: subtotal.toFixed(2),
      }
    })

    return response.json({
      carrinhoId: carrinho.id,
      itens: itensFormatados,
      totalParcial: totalParcial.toFixed(2),
    })
  } catch (error) {
    return responderErro(response, error, 'Não foi possível carregar o carrinho.')
  }
}

// 2. Adicionar Produto ao Carrinho
export async function adicionarItemCarrinho(request, response) {
  try {
    const { produtoId } = request.body ?? {}
    const quantidade = quantidadeValida(request.body?.quantidade ?? 1)
    const identidade = identidadeDoPedido(request, request.body)

    if (!produtoId || !quantidade) {
      return response.status(400).json({ message: 'Produto e quantidade válida são obrigatórios.' })
    }

    // ATENÇÃO: produtoId é tratado como String conforme o novo seed
    const idProdutoStr = String(produtoId)
    const produto = await prisma.produto.findUnique({ where: { id: idProdutoStr } })

    if (!produto || !produto.activo) {
      return response.status(404).json({ message: 'Produto não encontrado ou inativo.' })
    }

    if (produto.quantidadeStock <= 0) {
      return response.status(400).json({ message: 'Produto esgotado.' })
    }

    const carrinho = await obterOuCriarCarrinho(identidade)

    const itemExistente = await prisma.itemCarrinho.findFirst({
      where: {
        carrinhoId: carrinho.id,
        produtoId: idProdutoStr,
      },
    })

    const novaQuantidade = itemExistente ? itemExistente.quantidade + quantidade : quantidade

    if (novaQuantidade > produto.quantidadeStock) {
      return response.status(400).json({ 
        message: `Quantidade solicitada excede o stock disponível (${produto.quantidadeStock} unidades).` 
      })
    }

    if (itemExistente) {
      await prisma.itemCarrinho.update({
        where: { id: itemExistente.id },
        data: { quantidade: novaQuantidade },
      })
    } else {
      await prisma.itemCarrinho.create({
        data: {
          carrinhoId: carrinho.id,
          produtoId: idProdutoStr,
          quantidade,
        },
      })
    }

    return response.json({ message: 'Produto adicionado ao carrinho com sucesso.' })
  } catch (error) {
    return responderErro(response, error, 'Não foi possível adicionar o produto ao carrinho.')
  }
}

// 3. Atualizar Quantidade de um Item
export async function atualizarItemCarrinho(request, response) {
  try {
    const quantidade = quantidadeValida(request.body?.quantidade)
    if (!quantidade) {
      return response.status(400).json({ message: 'A quantidade deve ser pelo menos 1.' })
    }

    const item = await itemDoPedido(request, request.params.itemId, request.body)

    if (quantidade > item.produto.quantidadeStock) {
      return response.status(400).json({ 
        message: `Stock insuficiente. Disponível: ${item.produto.quantidadeStock}` 
      })
    }

    await prisma.itemCarrinho.update({
      where: { id: item.id },
      data: { quantidade },
    })

    return response.json({ message: 'Quantidade atualizada com sucesso.' })
  } catch (error) {
    return responderErro(response, error, 'Não foi possível atualizar o item.')
  }
}

// 4. Remover Item do Carrinho
export async function removerItemCarrinho(request, response) {
  try {
    // DELETE não tem corpo em todos os clientes: o token pode vir na query.
    const item = await itemDoPedido(request, request.params.itemId, { ...request.query, ...request.body })
    await prisma.itemCarrinho.delete({ where: { id: item.id } })

    return response.json({ message: 'Item removido do carrinho.' })
  } catch (error) {
    return responderErro(response, error, 'Não foi possível remover o item.')
  }
}

// 5. Fusão de Carrinhos ao Iniciar Sessão
export async function fundirCarrinhos(utilizadorId, tokenSessao) {
  if (!tokenSessao) return

  const carrinhoSessao = await prisma.carrinho.findUnique({
    where: { tokenSessao },
    include: { itens: true },
  })

  if (!carrinhoSessao || carrinhoSessao.itens.length === 0) return

  const carrinhoCliente = await obterOuCriarCarrinho({ utilizadorId })

  for (const itemSessao of carrinhoSessao.itens) {
    const itemExistente = await prisma.itemCarrinho.findFirst({
      where: {
        carrinhoId: carrinhoCliente.id,
        produtoId: itemSessao.produtoId,
      },
    })

    if (itemExistente) {
      await prisma.itemCarrinho.update({
        where: { id: itemExistente.id },
        data: { quantidade: itemExistente.quantidade + itemSessao.quantidade },
      })
    } else {
      await prisma.itemCarrinho.create({
        data: {
          carrinhoId: carrinhoCliente.id,
          produtoId: itemSessao.produtoId,
          quantidade: itemSessao.quantidade,
        },
      })
    }
  }

  await prisma.carrinho.delete({ where: { id: carrinhoSessao.id } }).catch(() => {})
}