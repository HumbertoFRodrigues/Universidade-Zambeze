import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ContaCabecalho, FuncionalidadeIndisponivel } from '../../components/conta/ContaLayout.jsx'
import { usePublicInfo } from '../../hooks/usePublicInfo.js'
import { useAuth } from '../../lib/AuthContext.jsx'
import { useEncomendaCliente } from '../../hooks/useEncomendaCliente.js'
import LoadingState from '../../components/common/LoadingState.jsx'
import { contaApi, devolucoesApi } from '../../services/api.js'
import { EstadoConta, ResultadoConta } from '../../components/conta/ResultadoConta.jsx'
import { useDadosConta } from '../../hooks/useDadosConta.js'
import { dataLegivel, formatarMZN } from '../../lib/format.js'
import { ESTADOS_DEVOLUCAO, ESTADOS_ENCOMENDA, mensagemDeErro, validarCodigoEncomenda } from '../../services/cliente.js'

// Pedidos de devolução: criar (POST /devolucoes) e consultar (/conta/devolucoes).
const VOLTAR = { to: '/conta/devolucoes', rotulo: 'Voltar às devoluções' }
const botaoVoltar = <Link className="botao botao-claro botao-pequeno" to={VOLTAR.to}>{VOLTAR.rotulo}</Link>
const botaoPolitica = <Link className="botao botao-claro botao-pequeno" to="/info/devolucao">Ver política de devolução</Link>

export function ReturnsPage() {
  const { data, error, loading, recarregar } = useDadosConta(opcoes => contaApi.devolucoes(opcoes), 'devolucoes')
  const devolucoes = data?.devolucoes || []
  return <>
    <ContaCabecalho
      titulo="Devoluções"
      descricao="Pedidos de devolução das suas encomendas."
      accao={<Link className="botao botao-claro botao-pequeno" to="/conta/devolucoes/nova">Pedir devolução</Link>}
    />
    <ResultadoConta loading={loading} error={error} recarregar={recarregar} mensagem="A carregar devoluções…"
      vazio={data && !devolucoes.length && 'Ainda não fez nenhum pedido de devolução.'}>
      <div className="conta-bloco">
        <dl className="conta-dados">
          {devolucoes.map(d => (
            <div key={d.id}>
              <dt><Link to={`/conta/devolucoes/${d.id}`}>{d.codigoDevolucao}</Link><br /><small className="suave">Encomenda {d.encomenda.codigoEncomenda} · {dataLegivel(d.criadoEm)}</small></dt>
              <dd><EstadoConta valor={d.estado} rotulos={ESTADOS_DEVOLUCAO} /></dd>
            </div>
          ))}
        </dl>
      </div>
    </ResultadoConta>
  </>
}

const MOTIVOS = {
  ARREPENDIMENTO: 'Mudei de ideias',
  DIFERENTE_DA_DESCRICAO: 'Diferente da descrição',
  DEFEITUOSO: 'Produto com defeito',
  OUTRO: 'Outro motivo',
}

// POST /devolucoes: a encomenda é identificada pelo código e pelo email da conta,
// e só encomendas concluídas aceitam devolução.
export function NewReturnPage() {
  const { regras } = usePublicInfo()
  const [parametros] = useSearchParams()
  const codigoInicial = parametros.get('encomenda') || ''
  const [codigo, setCodigo] = useState(validarCodigoEncomenda(codigoInicial) ? '' : codigoInicial.trim())
  const [entrada, setEntrada] = useState(codigoInicial)
  const [erroCodigo, setErroCodigo] = useState('')
  // Prazo configurado pela loja (configuracao_loja.regras_comerciais), quando existir.
  const prazo = Number(regras?.prazoDevolucaoDias)

  const abrir = e => {
    e.preventDefault()
    const mensagem = validarCodigoEncomenda(entrada)
    setErroCodigo(mensagem)
    if (!mensagem) setCodigo(entrada.trim())
  }

  return <>
    <ContaCabecalho titulo="Pedir devolução" voltar={VOLTAR} />
    {prazo > 0 && <p className="suave">Segundo as regras da loja, o prazo de devolução é de {prazo} dias.</p>}
    <form className="conta-bloco" onSubmit={abrir} noValidate>
      <h2>Encomenda</h2>
      <div className="conta-form-linha">
        <div className="conta-campo">
          <label htmlFor="devolucao-codigo">Código da encomenda</label>
          <input id="devolucao-codigo" value={entrada} onChange={e => setEntrada(e.target.value)} placeholder="Por exemplo, ENC-1A2B3C4D5E6F7A8B" aria-invalid={erroCodigo ? 'true' : undefined} />
        </div>
        <button className="botao botao-claro" type="submit">Abrir</button>
      </div>
      {erroCodigo && <p className="erro" role="alert">{erroCodigo}</p>}
    </form>
    {codigo && <FormularioDevolucao key={codigo} codigo={codigo} />}
  </>
}

function FormularioDevolucao({ codigo }) {
  const { user } = useAuth()
  const { data: encomenda, error, loading } = useEncomendaCliente(codigo, user.email)
  const [quantidades, setQuantidades] = useState({})
  const [motivo, setMotivo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [estado, setEstado] = useState({ aEnviar: false, erro: '', devolucao: null })

  if (loading) return <LoadingState mensagem="A carregar a encomenda…" />
  if (error) {
    return <FuncionalidadeIndisponivel titulo="Não foi possível abrir a encomenda">
      {error} Confirme o código e que a encomenda foi feita com o email {user.email}.
    </FuncionalidadeIndisponivel>
  }
  if (estado.devolucao) {
    return <div className="conta-bloco" role="status">
      <h2>Pedido registado</h2>
      <p>O pedido de devolução <b>{estado.devolucao.codigoDevolucao}</b> foi registado e aguarda análise da loja.</p>
      <div className="conta-links"><Link className="botao botao-claro botao-pequeno" to={`/conta/encomendas/${encodeURIComponent(codigo)}`}>Ver a encomenda</Link></div>
    </div>
  }
  if (encomenda.estado !== 'CONCLUIDA') {
    return <FuncionalidadeIndisponivel titulo="Esta encomenda não aceita devolução">
      Só é possível pedir a devolução de encomendas concluídas. Estado actual: {ESTADOS_ENCOMENDA[encomenda.estado] || encomenda.estado}.
    </FuncionalidadeIndisponivel>
  }

  const itensParaDevolver = encomenda.itens
    .map(item => ({ itemEncomendaId: item.id, quantidade: Number(quantidades[item.id]) || 0 }))
    .filter(item => item.quantidade > 0)

  const enviar = async e => {
    e.preventDefault()
    if (!itensParaDevolver.length) return setEstado({ ...estado, erro: 'Indique pelo menos um produto a devolver.' })
    if (!motivo) return setEstado({ ...estado, erro: 'Escolha o motivo da devolução.' })
    setEstado({ aEnviar: true, erro: '', devolucao: null })
    try {
      const resposta = await devolucoesApi.solicitar({
        codigoEncomenda: encomenda.codigoEncomenda,
        emailContacto: user.email,
        tipoMotivo: motivo,
        descricaoMotivo: descricao.trim() || undefined,
        itensParaDevolver,
      })
      setEstado({ aEnviar: false, erro: '', devolucao: resposta.devolucao })
    } catch (erro) {
      setEstado({ aEnviar: false, erro: mensagemDeErro(erro), devolucao: null })
    }
  }

  return <form className="conta-bloco conta-form" onSubmit={enviar} noValidate>
    <h2>Produtos a devolver</h2>
    {encomenda.itens.map(item => (
      <div key={item.id} className="conta-campo">
        <label htmlFor={`devolver-${item.id}`}>{item.nomeProduto} (comprou {item.quantidade})</label>
        <input id={`devolver-${item.id}`} type="number" min="0" max={item.quantidade} step="1" value={quantidades[item.id] ?? 0}
          onChange={e => setQuantidades({ ...quantidades, [item.id]: Math.min(Math.max(Math.floor(Number(e.target.value) || 0), 0), item.quantidade) })} />
      </div>
    ))}
    <div className="conta-campo">
      <label htmlFor="devolucao-motivo">Motivo</label>
      <select id="devolucao-motivo" value={motivo} onChange={e => setMotivo(e.target.value)}>
        <option value="">Escolha o motivo</option>
        {Object.entries(MOTIVOS).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
      </select>
    </div>
    <div className="conta-campo">
      <label htmlFor="devolucao-descricao">Descrição (opcional)</label>
      <textarea id="devolucao-descricao" maxLength={1000} value={descricao} onChange={e => setDescricao(e.target.value)} />
    </div>
    {estado.erro && <p className="erro" role="alert">{estado.erro}</p>}
    <div className="conta-links">
      <button className="botao botao-laranja" type="submit" disabled={estado.aEnviar}>{estado.aEnviar ? 'A enviar…' : 'Pedir devolução'}</button>
      {botaoPolitica}
    </div>
  </form>
}

// Etapas pela ordem do processo (estado_devolucao). REJEITADA termina o pedido após a análise.
const ETAPAS = ['SOLICITADA', 'APROVADA', 'PRODUTO_RECEBIDO', 'REEMBOLSADA']

function idDevolucaoValido(id) {
  return /^d+$/.test(id || '')
}

function ComDevolucao({ id, children }) {
  const { data, error, loading, recarregar } = useDadosConta(opcoes => contaApi.devolucao(id, opcoes), `devolucao-${id}`)
  return <ResultadoConta loading={loading} error={error} recarregar={recarregar} mensagem="A carregar o pedido…">
    {data && children(data.devolucao)}
  </ResultadoConta>
}

function DevolucaoInvalida() {
  return <FuncionalidadeIndisponivel titulo="Devolução inválida" accao={botaoVoltar}>
    O identificador indicado não corresponde a um pedido de devolução válido.
  </FuncionalidadeIndisponivel>
}

export function TrackReturnPage() {
  const { id } = useParams()
  const valido = idDevolucaoValido(id)
  return <>
    <ContaCabecalho
      titulo="Acompanhar devolução"
      voltar={valido ? { to: `/conta/devolucoes/${id}`, rotulo: 'Voltar à devolução' } : VOLTAR}
    />
    {valido
      ? <ComDevolucao id={id}>
          {d => {
            const rejeitada = d.estado === 'REJEITADA'
            const actual = ETAPAS.indexOf(d.estado === 'EM_ANALISE' ? 'SOLICITADA' : d.estado)
            return <div className="conta-bloco">
              <h2>{d.codigoDevolucao}</h2>
              {rejeitada
                ? <p>O pedido foi rejeitado{d.decididoEm ? ` em ${dataLegivel(d.decididoEm)}` : ''}.{d.justificacaoDecisao && <> Motivo: {d.justificacaoDecisao}</>}</p>
                : <ol className="conta-dados">
                    {ETAPAS.map((etapa, indice) => (
                      <li key={etapa}><strong>{indice <= actual ? '✓' : '○'}</strong> {ESTADOS_DEVOLUCAO[etapa]}</li>
                    ))}
                  </ol>}
            </div>
          }}
        </ComDevolucao>
      : <DevolucaoInvalida />}
  </>
}

export function ReturnDetailPage() {
  const { id } = useParams()
  return <>
    <ContaCabecalho titulo="Detalhe da devolução" voltar={VOLTAR} />
    {idDevolucaoValido(id)
      ? <ComDevolucao id={id}>
          {d => <>
            <div className="conta-bloco">
              <dl className="conta-dados">
                <div><dt>Pedido</dt><dd>{d.codigoDevolucao}</dd></div>
                <div><dt>Encomenda</dt><dd><Link to={`/conta/encomendas/${encodeURIComponent(d.encomenda.codigoEncomenda)}`}>{d.encomenda.codigoEncomenda}</Link></dd></div>
                <div><dt>Estado</dt><dd><EstadoConta valor={d.estado} rotulos={ESTADOS_DEVOLUCAO} /></dd></div>
                <div><dt>Motivo</dt><dd>{MOTIVOS[d.tipoMotivo] || d.tipoMotivo}</dd></div>
                {d.descricaoMotivo && <div><dt>Descrição</dt><dd>{d.descricaoMotivo}</dd></div>}
                <div><dt>Pedido em</dt><dd>{dataLegivel(d.criadoEm)}</dd></div>
                {d.justificacaoDecisao && <div><dt>Resposta da loja</dt><dd>{d.justificacaoDecisao}</dd></div>}
                {d.reembolso && <div><dt>Reembolso</dt><dd>{formatarMZN(d.reembolso.valor)}{d.reembolso.simulado ? ' (simulado)' : ''}</dd></div>}
              </dl>
            </div>
            <div className="conta-bloco">
              <h2>Produtos</h2>
              <ul>{d.itens.map(item => <li key={item.id}>{item.quantidade} × {item.itemEncomenda.nomeProduto}</li>)}</ul>
              <div className="conta-links"><Link className="botao botao-claro botao-pequeno" to={`/conta/devolucoes/${d.id}/acompanhar`}>Acompanhar</Link>{botaoPolitica}</div>
            </div>
          </>}
        </ComDevolucao>
      : <DevolucaoInvalida />}
  </>
}
