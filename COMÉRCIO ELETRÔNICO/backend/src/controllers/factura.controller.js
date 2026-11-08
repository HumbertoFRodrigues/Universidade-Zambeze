import * as facturas from '../services/factura.service.js'

export async function listarFacturasAdmin(req, res, next) {
  try {
    res.json(await facturas.listarFacturas(req.query))
  } catch (error) {
    next(error)
  }
}

export async function pdfFacturaAdmin(req, res, next) {
  try {
    const { factura, pdf } = await facturas.pdfAdmin(req.params.id)
    res.set('Content-Type', 'application/pdf')
    res.set('Content-Disposition', `attachment; filename="${factura.numero.replace(/[^A-Za-z0-9]+/g, '-')}.pdf"`)
    res.send(pdf)
  } catch (error) {
    next(error)
  }
}

export async function emitirFacturaAdmin(req, res, next) {
  try {
    res.status(201).json(await facturas.emitirFacturaAdmin(req.params.encomendaId, req.admin))
  } catch (error) {
    next(error)
  }
}
