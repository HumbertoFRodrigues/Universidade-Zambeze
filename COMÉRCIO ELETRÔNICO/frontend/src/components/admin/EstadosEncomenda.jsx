import { Badge } from '@/components/ui/badge'
import {
  CLASSES_ENCOMENDA,
  CLASSES_ENTREGA,
  CLASSES_PAGAMENTO,
  ESTADOS_ENCOMENDA,
  ESTADOS_ENTREGA,
  ESTADOS_PAGAMENTO,
  temPagamento,
} from '../../lib/encomendasAdmin.js'

// Estado da encomenda, do último pagamento e da entrega.
export default function EstadosEncomenda({ encomenda }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge className={CLASSES_ENCOMENDA[encomenda.estado]}>{ESTADOS_ENCOMENDA[encomenda.estado] || encomenda.estado}</Badge>
      {temPagamento(encomenda)
        ? <Badge className={CLASSES_PAGAMENTO[encomenda.pagamentoEstado]}>Pag.: {ESTADOS_PAGAMENTO[encomenda.pagamentoEstado] || encomenda.pagamentoEstado}</Badge>
        : <Badge variant="outline">Sem pagamento</Badge>}
      <Badge className={CLASSES_ENTREGA[encomenda.entregaEstado]}>{ESTADOS_ENTREGA[encomenda.entregaEstado] || encomenda.entregaEstado}</Badge>
    </div>
  )
}
