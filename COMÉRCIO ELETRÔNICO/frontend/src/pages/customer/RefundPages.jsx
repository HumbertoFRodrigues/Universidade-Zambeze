import { Link, useParams } from 'react-router-dom'
import { ContaCabecalho, FuncionalidadeIndisponivel } from '../../components/conta/ContaLayout.jsx'
import { EstadoConta, ResultadoConta } from '../../components/conta/ResultadoConta.jsx'
import { useDadosConta } from '../../hooks/useDadosConta.js'
import { contaApi } from '../../services/api.js'
import { ESTADOS_REEMBOLSO } from '../../services/cliente.js'
import { dataLegivel, formatarMZN } from '../../lib/format.js'

// Reembolsos dos pagamentos das encomendas da conta (/conta/reembolsos).
const VOLTAR = { to: '/conta/reembolsos', rotulo: 'Voltar aos reembolsos' }
const botaoVoltar = <Link className="botao botao-claro botao-pequeno" to={VOLTAR.to}>{VOLTAR.rotulo}</Link>

function LinhasReembolso({ r }) {
  return <dl className="conta-dados">
    <div><dt>Referência</dt><dd>{r.referenciaOperacao}</dd></div>
    <div><dt>Encomenda</dt><dd><Link to={`/conta/encomendas/${encodeURIComponent(r.pagamento.encomenda.codigoEncomenda)}`}>{r.pagamento.encomenda.codigoEncomenda}</Link></dd></div>
    {r.devolucao && <div><dt>Devolução</dt><dd><Link to={`/conta/devolucoes/${r.devolucao.id}`}>{r.devolucao.codigoDevolucao}</Link></dd></div>}
    <div><dt>Valor</dt><dd>{formatarMZN(r.valor)}{r.simulado ? ' (simulado)' : ''}</dd></div>
    <div><dt>Estado</dt><dd><EstadoConta valor={r.estado} rotulos={ESTADOS_REEMBOLSO} /></dd></div>
    {r.processadoEm && <div><dt>Processado em</dt><dd>{dataLegivel(r.processadoEm)}</dd></div>}
  </dl>
}

export function RefundsPage() {
  const { data, error, loading, recarregar } = useDadosConta(opcoes => contaApi.reembolsos(opcoes), 'reembolsos')
  const reembolsos = data?.reembolsos || []
  return <>
    <ContaCabecalho titulo="Reembolsos" descricao="Reembolsos de pagamentos e devoluções." />
    <ResultadoConta loading={loading} error={error} recarregar={recarregar} mensagem="A carregar reembolsos…"
      vazio={data && !reembolsos.length && 'Ainda não tem reembolsos.'}>
      {reembolsos.map(r => (
        <div key={r.id} className="conta-bloco">
          <LinhasReembolso r={r} />
          <div className="conta-links"><Link className="botao botao-claro botao-pequeno" to={`/conta/reembolsos/${r.id}`}>Ver</Link></div>
        </div>
      ))}
    </ResultadoConta>
  </>
}

function DetalheReembolso({ id }) {
  const { data, error, loading, recarregar } = useDadosConta(opcoes => contaApi.reembolso(id, opcoes), `reembolso-${id}`)
  return <ResultadoConta loading={loading} error={error} recarregar={recarregar} mensagem="A carregar o reembolso…">
    {data && <div className="conta-bloco"><LinhasReembolso r={data.reembolso} /></div>}
  </ResultadoConta>
}

export function RefundDetailPage() {
  const { id } = useParams()
  return <>
    <ContaCabecalho titulo="Detalhe do reembolso" voltar={VOLTAR} />
    {/^\d+$/.test(id || '')
      ? <DetalheReembolso id={id} />
      : <FuncionalidadeIndisponivel titulo="Reembolso inválido" accao={botaoVoltar}>
          O identificador indicado não corresponde a um reembolso válido.
        </FuncionalidadeIndisponivel>}
  </>
}
