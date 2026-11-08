import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ContaCabecalho, FuncionalidadeIndisponivel } from '../../components/conta/ContaLayout.jsx'
import { EstadoConta, ResultadoConta } from '../../components/conta/ResultadoConta.jsx'
import { useDadosConta } from '../../hooks/useDadosConta.js'
import { contaApi } from '../../services/api.js'
import { ESTADOS_PAGAMENTO, ESTADOS_REEMBOLSO } from '../../services/cliente.js'
import { dataLegivel, formatarMZN } from '../../lib/format.js'

// Pagamentos das encomendas da conta (/conta/pagamentos). Todos os pagamentos actuais são simulados.
const VOLTAR = { to: '/conta/pagamentos', rotulo: 'Voltar aos pagamentos' }
const botaoVoltar = <Link className="botao botao-claro botao-pequeno" to={VOLTAR.to}>{VOLTAR.rotulo}</Link>
const idPagamentoValido = id => /^\d+$/.test(id || '')

export function PaymentsPage() {
  const [pagina, setPagina] = useState(1)
  const { data, error, loading, recarregar } = useDadosConta(opcoes => contaApi.pagamentos({ pagina, limite: 10 }, opcoes), `pagamentos-${pagina}`)
  const pagamentos = data?.pagamentos || []
  return <>
    <ContaCabecalho titulo="Pagamentos" descricao="Histórico dos pagamentos associados às suas encomendas." />
    <ResultadoConta loading={loading} error={error} recarregar={recarregar} mensagem="A carregar pagamentos…"
      vazio={data && !pagamentos.length && 'Ainda não há pagamentos associados às suas encomendas.'}>
      <div className="conta-bloco">
        <dl className="conta-dados">
          {pagamentos.map(p => (
            <div key={p.id}>
              <dt><Link to={`/conta/pagamentos/${p.id}`}>{p.referenciaOperacao}</Link><br /><small className="suave">Encomenda {p.encomenda.codigoEncomenda} · {p.formaPagamento.nome}</small></dt>
              <dd>{formatarMZN(p.valor)} <EstadoConta valor={p.estado} rotulos={ESTADOS_PAGAMENTO} /></dd>
            </div>
          ))}
        </dl>
        {data?.totalPaginas > 1 && <div className="conta-links">
          <button type="button" className="botao botao-claro botao-pequeno" disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)}>Anterior</button>
          <span className="suave">Página {data.pagina} de {data.totalPaginas}</span>
          <button type="button" className="botao botao-claro botao-pequeno" disabled={pagina >= data.totalPaginas} onClick={() => setPagina(p => p + 1)}>Seguinte</button>
        </div>}
      </div>
    </ResultadoConta>
  </>
}

function LinhasPagamento({ p }) {
  return <dl className="conta-dados">
    <div><dt>Referência</dt><dd>{p.referenciaOperacao}</dd></div>
    <div><dt>Encomenda</dt><dd><Link to={`/conta/encomendas/${encodeURIComponent(p.encomenda.codigoEncomenda)}`}>{p.encomenda.codigoEncomenda}</Link></dd></div>
    <div><dt>Forma de pagamento</dt><dd>{p.formaPagamento.nome}{p.simulado ? ' (simulado)' : ''}</dd></div>
    <div><dt>Valor</dt><dd>{formatarMZN(p.valor)}</dd></div>
    {Number(p.valorReembolsado) > 0 && <div><dt>Reembolsado</dt><dd>{formatarMZN(p.valorReembolsado)}</dd></div>}
    <div><dt>Estado</dt><dd><EstadoConta valor={p.estado} rotulos={ESTADOS_PAGAMENTO} /></dd></div>
    {p.confirmadoEm && <div><dt>Confirmado em</dt><dd>{dataLegivel(p.confirmadoEm)}</dd></div>}
    {p.motivoFalha && <div><dt>Motivo da falha</dt><dd>{p.motivoFalha}</dd></div>}
    {p.reembolsos.map(r => (
      <div key={r.id}><dt>Reembolso {r.referenciaOperacao}</dt><dd>{formatarMZN(r.valor)} <EstadoConta valor={r.estado} rotulos={ESTADOS_REEMBOLSO} /></dd></div>
    ))}
  </dl>
}

function DetalhePagamento({ id }) {
  const { data, error, loading, recarregar } = useDadosConta(opcoes => contaApi.pagamento(id, opcoes), `pagamento-${id}`)
  return <ResultadoConta loading={loading} error={error} recarregar={recarregar} mensagem="A carregar o pagamento…">
    {data && <div className="conta-bloco"><LinhasPagamento p={data.pagamento} /></div>}
  </ResultadoConta>
}

function PagamentoInvalido() {
  return <FuncionalidadeIndisponivel titulo="Pagamento inválido" accao={botaoVoltar}>
    O identificador indicado não corresponde a um pagamento válido.
  </FuncionalidadeIndisponivel>
}

export function PaymentDetailPage() {
  const { id } = useParams()
  return <>
    <ContaCabecalho titulo="Detalhe do pagamento" voltar={VOLTAR} />
    {idPagamentoValido(id) ? <DetalhePagamento id={id} /> : <PagamentoInvalido />}
  </>
}

// O resultado vem sempre do servidor: parâmetros do URL (por exemplo ?estado=sucesso) são ignorados.
export function PaymentResultPage() {
  const { id } = useParams()
  return <>
    <ContaCabecalho titulo="Resultado do pagamento" voltar={VOLTAR} />
    {idPagamentoValido(id) ? <DetalhePagamento id={id} /> : <PagamentoInvalido />}
  </>
}
