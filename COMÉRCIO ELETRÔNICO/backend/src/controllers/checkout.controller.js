import { ErroCheckout } from '../errors/ErroCheckout.js'
import {
  atualizarEstadoEntrega as atualizarEstadoEntregaService,
  calcularFrete as calcularFreteService,
  confirmarCheckout as confirmarCheckoutService,
  listarOpcoesEntrega as listarOpcoesEntregaService,
  obterEstadoEntrega as obterEstadoEntregaService,
} from '../services/checkout.service.js'

export async function listarOpcoesEntrega(_request, response) {
  try {
    return response.json(await listarOpcoesEntregaService())
  } catch (error) {
    if (error instanceof ErroCheckout) {
      return response.status(error.status).json({ message: error.message })
    }
    console.error('Erro ao listar opções de entrega:', error)
    return response.status(500).json({ message: 'Não foi possível carregar as opções de entrega.' })
  }
}

export async function calcularFrete(request, response) {
  try {
    const cotacao = await calcularFreteService(request.body ?? {}, request.utilizador ?? null)
    return response.json(cotacao)
  } catch (error) {
    if (error instanceof ErroCheckout) {
      return response.status(error.status).json({ message: error.message })
    }
    console.error('Erro ao calcular frete:', error)
    return response.status(500).json({ message: 'Não foi possível calcular o frete.' })
  }
}

export async function confirmarCheckout(request, response) {
  try {
    const resultado = await confirmarCheckoutService(
      request.body ?? {},
      request.get('x-idempotency-key'),
      request.utilizador ?? null,
    )
    return response.status(resultado.repetida ? 200 : 201).json(resultado)
  } catch (error) {
    if (error instanceof ErroCheckout) {
      return response.status(error.status).json({ message: error.message })
    }
    console.error('Erro ao confirmar checkout:', error)
    return response.status(500).json({ message: 'Não foi possível confirmar a encomenda.' })
  }
}

export async function obterEstadoEntrega(request, response) {
  try {
    const estado = await obterEstadoEntregaService(request.params.codigo, request.query.email)
    return response.json(estado)
  } catch (error) {
    if (error instanceof ErroCheckout) {
      return response.status(error.status).json({ message: error.message })
    }
    console.error('Erro ao consultar estado da entrega:', error)
    return response.status(500).json({ message: 'Não foi possível consultar o estado da entrega.' })
  }
}

export async function atualizarEstadoEntrega(request, response) {
  try {
    const entrega = await atualizarEstadoEntregaService(
      request.params.encomendaId,
      request.body ?? {},
      request.admin.id,
    )
    return response.json({ entrega })
  } catch (error) {
    if (error instanceof ErroCheckout) {
      return response.status(error.status).json({ message: error.message })
    }
    console.error('Erro ao actualizar estado da entrega:', error)
    return response.status(500).json({ message: 'Não foi possível actualizar o estado da entrega.' })
  }
}
