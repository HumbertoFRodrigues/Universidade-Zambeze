import * as encomendaService from '../services/encomenda.service.js'
import { pdfDaEncomenda } from '../services/factura.service.js'

export async function consultar(req, res, next) {
  try {
    const { codigo } = req.params
    const { email } = req.query

    const encomenda = await encomendaService.consultarEncomenda(codigo, email, req.utilizador ?? null)
    res.status(200).json(encomenda)
  } catch (error) {
    next(error)
  }
}

export async function cancelar(req, res, next) {
  try {
    const { codigo } = req.params
    const { email } = req.body ?? {}

    const resultado = await encomendaService.cancelarEncomenda(codigo, email, req.utilizador ?? null)
    res.status(200).json(resultado)
  } catch (error) {
    next(error)
  }
}

// PDF da factura: mesmo controlo de acesso da encomenda (email de contacto ou sessão do dono).
export async function factura(req, res, next) {
  try {
    const encomenda = await encomendaService.consultarEncomenda(req.params.codigo, req.query.email, req.utilizador ?? null)
    const { factura, pdf } = await pdfDaEncomenda(encomenda.id)
    res.set('Content-Type', 'application/pdf')
    res.set('Content-Disposition', `attachment; filename="${factura.numero.replace(/[^A-Za-z0-9]+/g, '-')}.pdf"`)
    res.send(pdf)
  } catch (error) {
    next(error)
  }
}
