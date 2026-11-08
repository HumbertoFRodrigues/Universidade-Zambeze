import { prisma } from '../lib/prisma.js'

// ==================== 1. GESTÃO DE CATEGORIAS ====================

export async function criarCategoria(req, res) {
  try {
    const { nome, categoriaPaiId } = req.body
    if (!nome) return res.status(400).json({ message: 'O nome da categoria é obrigatório.' })

    const novaCategoria = await prisma.categoria.create({
      data: {
        nome,
        categoriaPaiId: categoriaPaiId ? Number(categoriaPaiId) : null,
        activo: true,
      },
    })

    await prisma.registoAuditoria.create({
      data: {
        utilizadorAutorId: req.admin.id,
        accao: 'CRIAR_CATEGORIA',
        tipoEntidade: 'categoria',
        idEntidade: String(novaCategoria.id),
        detalhes: { nome },
      },
    })

    return res.status(201).json({ message: 'Categoria criada com sucesso.', categoria: novaCategoria })
  } catch (error) {
    console.error('Erro ao criar categoria:', error)
    return res.status(500).json({ message: 'Não foi possível criar a categoria.' })
  }
}

// ==================== 2. GESTÃO DE PRODUTOS & IMAGENS ====================

export async function criarProduto(req, res) {
  try {
    const { slug, codigo, nome, marca, descricao, especificacoes, garantia, preco, codigoMoeda = 'MZN', quantidadeStock = 0, limiarStockBaixo = 5, categoriaId, imagens = [] } = req.body

    if (!slug || !codigo || !nome || !preco || !categoriaId) {
      return res.status(400).json({ message: 'Campos obrigatórios em falta (slug, codigo, nome, preco, categoriaId).' })
    }

    const produto = await prisma.produto.create({
      data: {
        id: `seed-easyshop-produto-${Date.now()}`, // Ou gerado de forma única
        slug,
        codigo,
        nome,
        marca,
        descricao,
        especificacoes: especificacoes || {},
        garantia,
        preco: String(preco),
        codigoMoeda,
        quantidadeStock: Number(quantidadeStock),
        limiarStockBaixo: Number(limiarStockBaixo),
        categoriaId: Number(categoriaId),
        activo: true,
        imagens: {
          create: imagens.map((img, index) => ({
            url: img.url,
            textoAlternativo: img.textoAlternativo || nome,
            ordem: img.ordem ?? index,
            principal: img.principal ?? (index === 0),
          })),
        },
      },
      include: { imagens: true },
    })

    // Se houver stock inicial, regista o movimento de stock
    if (Number(quantidadeStock) > 0) {
      await prisma.movimentoStock.create({
        data: {
          produtoId: produto.id,
          tipoMovimento: 'ENTRADA',
          variacaoQuantidade: Number(quantidadeStock),
          stockApos: Number(quantidadeStock),
          motivo: 'Stock inicial de cadastro',
          criadoPor: req.admin.id,
        },
      })
    }

    await prisma.registoAuditoria.create({
      data: {
        utilizadorAutorId: req.admin.id,
        accao: 'CRIAR_PRODUTO',
        tipoEntidade: 'produto',
        idEntidade: produto.id,
        detalhes: { nome, codigo, preco },
      },
    })

    return res.status(201).json({ message: 'Produto criado com sucesso.', produto })
  } catch (error) {
    console.error('Erro ao criar produto:', error)
    return res.status(500).json({ message: 'Não foi possível criar o produto.' })
  }
}

// ==================== 3. GESTÃO DE PREÇOS (COM HISTÓRICO) ====================

export async function atualizarPrecoProduto(req, res) {
  try {
    const { produtoId } = req.params
    const { novoPreco, motivo } = req.body

    if (novoPreco === undefined || !motivo) {
      return res.status(400).json({ message: 'O novo preço e o motivo da alteração são obrigatórios.' })
    }

    const produtoAtual = await prisma.produto.findUnique({ where: { id: produtoId } })
    if (!produtoAtual) return res.status(404).json({ message: 'Produto não encontrado.' })

    const precoAntigo = produtoAtual.preco

    const produtoAtualizado = await prisma.produto.update({
      where: { id: produtoId },
      data: { preco: String(novoPreco), actualizadoEm: new Date() },
    })

    // Registo de auditoria detalhado para histórico de preços
    await prisma.registoAuditoria.create({
      data: {
        utilizadorAutorId: req.admin.id,
        accao: 'ALTERAR_PRECO',
        tipoEntidade: 'produto',
        idEntidade: produtoId,
        detalhes: {
          precoAntigo,
          precoNovo: String(novoPreco),
          motivo,
        },
      },
    })

    return res.json({ message: 'Preço atualizado com sucesso.', produto: produtoAtualizado })
  } catch (error) {
    console.error('Erro ao atualizar preço:', error)
    return res.status(500).json({ message: 'Não foi possível atualizar o preço.' })
  }
}

// ==================== 4. GESTÃO DE STOCK (ENTRADAS E AJUSTES) ====================

export async function gerirStockProduto(req, res) {
  try {
    const { produtoId } = req.params
    const { tipoMovimento, variacao, motivo } = req.body // tipoMovimento: 'ENTRADA' ou 'AJUSTE'

    if (!tipoMovimento || variacao === undefined || !motivo) {
      return res.status(400).json({ message: 'Tipo de movimento, variação e motivo são obrigatórios.' })
    }

    const produto = await prisma.produto.findUnique({ where: { id: produtoId } })
    if (!produto) return res.status(404).json({ message: 'Produto não encontrado.' })

    const delta = Number(variacao)
    const novoStock = produto.quantidadeStock + delta

    if (novoStock < 0) {
      return res.status(400).json({ message: `Stock insuficiente para ajuste. Stock atual: ${produto.quantidadeStock}` })
    }

    // Atualiza o stock no produto
    await prisma.produto.update({
      where: { id: produtoId },
      data: { quantidadeStock: novoStock, actualizadoEm: new Date() },
    })

    // Regista no livro de stock com motivo e responsável
    await prisma.movimentoStock.create({
      data: {
        produtoId,
        tipoMovimento: tipoMovimento.toUpperCase(), // 'ENTRADA' ou 'AJUSTE'
        variacaoQuantidade: delta,
        stockApos: novoStock,
        motivo,
        criadoPor: req.admin.id,
      },
    })

    await prisma.registoAuditoria.create({
      data: {
        utilizadorAutorId: req.admin.id,
        accao: 'AJUSTAR_STOCK',
        tipoEntidade: 'produto',
        idEntidade: produtoId,
        detalhes: { tipoMovimento, variacao: delta, novoStock, motivo },
      },
    })

    return res.json({
      message: 'Stock atualizado com sucesso.',
      produtoId,
      stockAnterior: produto.quantidadeStock,
      stockAtual: novoStock,
    })
  } catch (error) {
    console.error('Erro ao gerir stock:', error)
    return res.status(500).json({ message: 'Não foi possível atualizar o stock.' })
  }
}

// ==================== 5. RELATÓRIO DE STOCK BAIXO ====================

export async function listarStockBaixo(req, res) {
  try {
    // Produtos onde a quantidade em stock é menor ou igual ao limiar definido
    const produtos = await prisma.produto.findMany({
      where: {
        activo: true,
        OR: [
          { quantidadeStock: { lte: prisma.produto.fields.limiarStockBaixo } },
          { quantidadeStock: { lte: 5 } } // fallback padrão
        ]
      },
      select: {
        id: true,
        codigo: true,
        nome: true,
        quantidadeStock: true,
        limiarStockBaixo: true,
        preco: true,
      },
    })

    return res.json({ produtosStockBaixo: produtos, total: produtos.length })
  } catch (error) {
    console.error('Erro ao listar stock baixo:', error)
    return res.status(500).json({ message: 'Não foi possível obter o relatório de stock baixo.' })
  }
}