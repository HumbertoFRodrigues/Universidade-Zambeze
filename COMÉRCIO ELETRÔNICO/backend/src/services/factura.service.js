// Facturas da loja.
// ATENÇÃO: o modelo de factura (campos, arredondamento do IVA, numeração e PDF) foi feito para
// demonstração e PRECISA DE VALIDAÇÃO POR UM CONTABILISTA antes de uso real em Moçambique.
import PDFDocument from 'pdfkit'
import { prisma } from '../lib/prisma.js'
import { formatarDinheiro, paraCentavos } from '../utils/dinheiro.js'
import { identificador, paginacao } from '../validators/conta.validator.js'
import { anoEmMocambique, ivaIncluido, numeroFactura } from './precos.js'

export const AVISO_FACTURA = 'Modelo de factura por validar por um contabilista; documento gerado por sistema de demonstração.'

// Dados fiscais guardados na encomenda no momento da compra (IVA incluído no total).
export async function dadosFiscaisEncomenda(client, totalCentavos, { nome, nuit = null, morada }) {
  const configuracao = await client.configuracaoLoja.findUnique({ where: { id: 1 }, select: { taxaIva: true } })
  const taxa = Number(configuracao?.taxaIva ?? 16)
  const { baseCentavos, ivaCentavos } = ivaIncluido(totalCentavos, taxa)
  return {
    taxaIva: taxa.toFixed(2),
    baseTributavel: formatarDinheiro(baseCentavos),
    valorIva: formatarDinheiro(ivaCentavos),
    facturacaoNome: String(nome).slice(0, 200),
    facturacaoNuit: nuit,
    facturacaoMorada: String(morada).slice(0, 500),
  }
}

// Emite a factura de uma encomenda paga, dentro da transacção do pagamento (idempotente:
// se já existir, devolve a existente). O número vem de serie_factura com INSERT … ON CONFLICT,
// que bloqueia a linha do ano até ao fim da transacção: sem saltos nem números repetidos.
export async function emitirFactura(tx, encomendaId) {
  const existente = await tx.factura.findUnique({ where: { encomendaId } })
  if (existente) return existente

  const [encomenda, configuracao] = await Promise.all([
    tx.encomenda.findUnique({ where: { id: encomendaId } }),
    tx.configuracaoLoja.findUnique({ where: { id: 1 } }),
  ])
  if (!encomenda) throw { status: 404, message: 'Encomenda não encontrada.' }
  const pago = await tx.pagamento.count({ where: { encomendaId, estado: { in: ['CONFIRMADO', 'REEMBOLSADO'] } } })
  if (!pago) throw { status: 409, message: 'Só é possível facturar encomendas com pagamento confirmado.' }

  const totalCentavos = paraCentavos(encomenda.valorTotal)
  // Encomendas antigas (sem dados fiscais guardados) usam a taxa actual e o contacto/entrega.
  const taxa = Number(encomenda.taxaIva ?? configuracao?.taxaIva ?? 16)
  const { baseCentavos, ivaCentavos } = encomenda.valorIva !== null
    ? { baseCentavos: paraCentavos(encomenda.baseTributavel), ivaCentavos: paraCentavos(encomenda.valorIva) }
    : ivaIncluido(totalCentavos, taxa)

  const emitidaEm = new Date()
  const ano = anoEmMocambique(emitidaEm)
  const [{ ultimo_numero: sequencia }] = await tx.$queryRaw`
    INSERT INTO "serie_factura" ("ano", "ultimo_numero") VALUES (${ano}, 1)
    ON CONFLICT ("ano") DO UPDATE SET "ultimo_numero" = "serie_factura"."ultimo_numero" + 1
    RETURNING "ultimo_numero"`

  return tx.factura.create({
    data: {
      numero: numeroFactura(ano, sequencia),
      ano,
      sequencia,
      encomendaId,
      emitidaEm,
      vendedorNome: configuracao?.designacaoLegal || configuracao?.nomeMarca || 'EasyShop',
      vendedorNuit: configuracao?.nuit ?? null,
      vendedorMorada: configuracao?.morada ?? null,
      clienteNome: encomenda.facturacaoNome || encomenda.nomeContacto,
      clienteNuit: encomenda.facturacaoNuit,
      clienteMorada: encomenda.facturacaoMorada ||
        [encomenda.entregaLinhaEndereco, encomenda.entregaCidade, encomenda.entregaProvincia].filter(Boolean).join(', '),
      subtotal: encomenda.valorSubtotal,
      totalDesconto: encomenda.totalDesconto,
      valorFrete: encomenda.valorFrete,
      baseTributavel: formatarDinheiro(baseCentavos),
      taxaIva: taxa.toFixed(2),
      valorIva: formatarDinheiro(ivaCentavos),
      total: encomenda.valorTotal,
      codigoMoeda: configuracao?.codigoMoeda || 'MZN',
    },
  })
}

// ==================== PDF ====================

const moeda = (valor, codigo) => `${Number(valor).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${codigo}`

export function gerarPdfFactura(factura, itens) {
  return new Promise((resolver, rejeitar) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Factura ${factura.numero}` } })
    const partes = []
    doc.on('data', parte => partes.push(parte))
    doc.on('end', () => resolver(Buffer.concat(partes)))
    doc.on('error', rejeitar)

    const m = factura.codigoMoeda
    doc.fontSize(18).text('FACTURA', { align: 'right' })
    doc.fontSize(11).text(factura.numero, { align: 'right' })
    doc.text(`Data de emissão: ${new Date(factura.emitidaEm).toLocaleDateString('pt-PT', { timeZone: 'Africa/Maputo' })}`, { align: 'right' })
    doc.moveDown()

    doc.fontSize(10).font('Helvetica-Bold').text('Vendedor')
    doc.font('Helvetica').text(factura.vendedorNome)
    doc.text(`NUIT: ${factura.vendedorNuit || 'não configurado'}`)
    if (factura.vendedorMorada) doc.text(factura.vendedorMorada)
    doc.moveDown()
    doc.font('Helvetica-Bold').text('Cliente')
    doc.font('Helvetica').text(factura.clienteNome)
    doc.text(`NUIT: ${factura.clienteNuit || 'consumidor final'}`)
    doc.text(factura.clienteMorada)
    doc.moveDown()

    // Tabela de itens: descrição, quantidade, preço unitário (IVA incluído), desconto e total.
    const colunas = [50, 290, 340, 420, 480]
    const linhaTabela = (valores, negrito = false) => {
      const y = doc.y
      doc.font(negrito ? 'Helvetica-Bold' : 'Helvetica').fontSize(9)
      doc.text(valores[0], colunas[0], y, { width: 235 })
      const altura = doc.y
      doc.text(valores[1], colunas[1], y, { width: 45, align: 'right' })
      doc.text(valores[2], colunas[2], y, { width: 75, align: 'right' })
      doc.text(valores[3], colunas[3], y, { width: 55, align: 'right' })
      doc.text(valores[4], colunas[4], y, { width: 65, align: 'right' })
      doc.y = Math.max(altura, doc.y) + 4
      doc.x = 50
    }
    linhaTabela(['Descrição', 'Qtd.', 'Preço unit.', 'Desconto', 'Total'], true)
    for (const item of itens) {
      const liquido = (paraCentavos(item.precoUnitario) - paraCentavos(item.descontoUnitario)) * item.quantidade
      linhaTabela([
        `${item.nomeProduto} (${item.codigoProduto})`,
        String(item.quantidade),
        moeda(item.precoUnitario, m),
        Number(item.descontoUnitario) ? moeda(item.descontoUnitario, m) : '—',
        moeda(formatarDinheiro(liquido), m),
      ])
    }
    doc.moveDown()

    const total = (rotulo, valor, negrito = false) => {
      doc.font(negrito ? 'Helvetica-Bold' : 'Helvetica').fontSize(10)
      doc.text(`${rotulo}: ${valor}`, 300, doc.y, { width: 245, align: 'right' })
    }
    total('Subtotal (IVA incluído)', moeda(factura.subtotal, m))
    if (Number(factura.totalDesconto)) total('Descontos', `-${moeda(factura.totalDesconto, m)}`)
    total('Entrega', moeda(factura.valorFrete, m))
    total('Base tributável', moeda(factura.baseTributavel, m))
    total(`IVA (${Number(factura.taxaIva)}%)`, moeda(factura.valorIva, m))
    total('Total', moeda(factura.total, m), true)

    doc.moveDown(2)
    doc.x = 50
    doc.font('Helvetica-Oblique').fontSize(8).fillColor('#666666')
      .text('Preços com IVA incluído.', { width: 495 })
      .text(AVISO_FACTURA, { width: 495 })
    doc.end()
  })
}

const incluirItens = { encomenda: { select: { codigoEncomenda: true, itens: { orderBy: { id: 'asc' } } } } }

// Cliente: factura de uma encomenda a que tem acesso (verificado por quem chama).
export async function pdfDaEncomenda(encomendaId) {
  const factura = await prisma.factura.findUnique({ where: { encomendaId }, include: incluirItens })
  if (!factura) throw { status: 404, message: 'Esta encomenda ainda não tem factura (é emitida quando o pagamento é confirmado).' }
  return { factura, pdf: await gerarPdfFactura(factura, factura.encomenda.itens) }
}

// ==================== Administração ====================

export async function listarFacturas(query = {}) {
  const pagina = paginacao(query, { limitePadrao: 20 })
  const [facturas, total] = await Promise.all([
    prisma.factura.findMany({
      select: {
        id: true, numero: true, emitidaEm: true, clienteNome: true, clienteNuit: true, total: true, valorIva: true, codigoMoeda: true,
        encomenda: { select: { codigoEncomenda: true } },
      },
      orderBy: [{ ano: 'desc' }, { sequencia: 'desc' }],
      skip: pagina.skip,
      take: pagina.take,
    }),
    prisma.factura.count(),
  ])
  return { facturas, total, pagina: pagina.pagina, totalPaginas: Math.max(Math.ceil(total / pagina.take), 1), aviso: AVISO_FACTURA }
}

export async function pdfAdmin(id) {
  const factura = await prisma.factura.findUnique({ where: { id: identificador(id, 'identificador da factura') }, include: incluirItens })
  if (!factura) throw { status: 404, message: 'Factura não encontrada.' }
  return { factura, pdf: await gerarPdfFactura(factura, factura.encomenda.itens) }
}

// Emissão manual para encomendas pagas sem factura (por exemplo, anteriores a esta funcionalidade).
export async function emitirFacturaAdmin(encomendaId, admin) {
  const id = identificador(encomendaId, 'identificador da encomenda')
  const factura = await prisma.$transaction(async tx => {
    const antes = await tx.factura.findUnique({ where: { encomendaId: id }, select: { id: true } })
    const emitida = await emitirFactura(tx, id)
    if (!antes) {
      await tx.registoAuditoria.create({
        data: { utilizadorAutorId: admin.id, accao: 'EMISSAO_FACTURA', tipoEntidade: 'factura', idEntidade: String(emitida.id), detalhes: { numero: emitida.numero } },
      })
    }
    return emitida
  })
  return { message: `Factura ${factura.numero} emitida.`, factura }
}
