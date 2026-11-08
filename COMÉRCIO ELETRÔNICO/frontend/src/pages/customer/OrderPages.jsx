import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext.jsx'
import { useEncomendaCliente } from '../../hooks/useEncomendaCliente.js'
import { useDadosConta } from '../../hooks/useDadosConta.js'
import { ResultadoConta } from '../../components/conta/ResultadoConta.jsx'
import { checkoutApi, contaApi, facturasApi } from '../../services/api.js'
import { PagarEncomenda } from '../../components/pagamento/PagarEncomenda.jsx'
import { ContaCabecalho, FuncionalidadeIndisponivel } from '../../components/conta/ContaLayout.jsx'
import { ConsultarEncomenda } from '../../components/conta/ConsultarEncomenda.jsx'
import LoadingState from '../../components/common/LoadingState.jsx'
import { dataLegivel, formatarMZN } from '../../lib/format.js'
import { ESTADOS_ENCOMENDA, ESTADOS_ENTREGA, clienteApi, mensagemDeErro, validarCodigoEncomenda } from '../../services/cliente.js'

// Estados em que o backend aceita o cancelamento pelo cliente (encomenda.service.js).
const CANCELAVEIS = ['REGISTADA', 'EM_PROCESSAMENTO']

const VOLTAR = { to: '/conta/encomendas', rotulo: 'Voltar às encomendas' }
const botaoConta = <Link className="botao botao-claro botao-pequeno" to={VOLTAR.to}>{VOLTAR.rotulo}</Link>

function Estado({ valor, rotulos }) {
  return <span className={`conta-estado conta-estado--${valor}`}>{rotulos[valor] || valor}</span>
}

// Só pede a encomenda ao servidor depois de validar o código do URL.
function ComEncomenda({ children }) {
  const { codigo } = useParams()
  const erro = validarCodigoEncomenda(codigo)
  if (erro) {
    return <FuncionalidadeIndisponivel titulo="Encomenda inválida" accao={botaoConta}>{erro}</FuncionalidadeIndisponivel>
  }
  return <CarregarEncomenda codigo={codigo.trim()}>{children}</CarregarEncomenda>
}

// O endpoint só devolve a encomenda quando o email de contacto coincide com o
// email da sessão, por isso o cliente não consegue consultar encomendas de outros.
function CarregarEncomenda({ codigo, children }) {
  const { user } = useAuth()
  const [versao, setVersao] = useState(0)
  const { data, error, loading } = useEncomendaCliente(codigo, user.email, versao)

  if (loading) return <LoadingState mensagem="A carregar a encomenda…" />
  if (error) {
    return <FuncionalidadeIndisponivel titulo="Não foi possível abrir a encomenda" accao={botaoConta}>
      {error} Confirme o código e que a encomenda foi feita com o email {user.email}.
    </FuncionalidadeIndisponivel>
  }
  return children(data, () => setVersao(v => v + 1))
}

export function OrdersPage() {
  const [pagina, setPagina] = useState(1)
  const { data, error, loading, recarregar } = useDadosConta(opcoes => contaApi.encomendas({ pagina, limite: 10 }, opcoes), `encomendas-${pagina}`)
  const encomendas = data?.encomendas || []
  return <>
    <ContaCabecalho titulo="As minhas encomendas" descricao="Encomendas feitas com a sua conta ou com o email da conta." />
    <ResultadoConta loading={loading} error={error} recarregar={recarregar} mensagem="A carregar encomendas…"
      vazio={data && !encomendas.length && 'Ainda não fez nenhuma encomenda.'}>
      <div className="conta-bloco">
        <dl className="conta-dados">
          {encomendas.map(e => (
            <div key={e.codigoEncomenda}>
              <dt>
                <Link to={`/conta/encomendas/${encodeURIComponent(e.codigoEncomenda)}`}>{e.codigoEncomenda}</Link>
                <br /><small className="suave">{dataLegivel(e.criadoEm)} · {e.totalItens} {e.totalItens === 1 ? 'produto' : 'produtos'}</small>
              </dt>
              <dd>{formatarMZN(e.valorTotal)} <Estado valor={e.estado} rotulos={ESTADOS_ENCOMENDA} /></dd>
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
    <ConsultarEncomenda titulo="Abrir uma encomenda pelo código" />
  </>
}

export function OrderDetailPage() {
  const { codigo } = useParams()
  return <>
    <ContaCabecalho titulo={`Encomenda ${codigo}`} voltar={VOLTAR} />
    <ComEncomenda>
      {(encomenda, recarregar) => <>
        <div className="conta-bloco">
          <h2>Estado</h2>
          <dl className="conta-dados">
            <div><dt>Encomenda</dt><dd><Estado valor={encomenda.estado} rotulos={ESTADOS_ENCOMENDA} /></dd></div>
            <div><dt>Entrega</dt><dd>{encomenda.entrega ? <Estado valor={encomenda.entrega.estado} rotulos={ESTADOS_ENTREGA} /> : 'Sem informação de entrega'}</dd></div>
            {encomenda.entrega?.expedidoEm && <div><dt>Expedida em</dt><dd>{dataLegivel(encomenda.entrega.expedidoEm)}</dd></div>}
            {encomenda.entrega?.entregueEm && <div><dt>Entregue em</dt><dd>{dataLegivel(encomenda.entrega.entregueEm)}</dd></div>}
            {encomenda.entrega?.recebidoPor && <div><dt>Recebida por</dt><dd>{encomenda.entrega.recebidoPor}</dd></div>}
            {encomenda.entrega?.observacao && <div><dt>Observação</dt><dd>{encomenda.entrega.observacao}</dd></div>}
          </dl>
        </div>
        <DetalheEncomenda encomenda={encomenda} />
        <AccoesEncomenda encomenda={encomenda} aoActualizar={recarregar} />
      </>}
    </ComEncomenda>
  </>
}

function DetalheEncomenda({ encomenda }) {
  const morada = [encomenda.entregaLinhaEndereco, encomenda.entregaCidade, encomenda.entregaProvincia].filter(Boolean).join(', ')
  return <>
    <div className="conta-bloco">
      <h2>Produtos</h2>
      <dl className="conta-dados">
        {encomenda.itens.map(item => {
          const unitario = Number(item.precoUnitario) - Number(item.descontoUnitario)
          return <div key={item.id}>
            <dt>
              {item.quantidade} × {item.nomeProduto}{item.nomePromocao ? ` (${item.nomePromocao})` : ''}
              {encomenda.estado === 'CONCLUIDA' && item.produto?.slug && <>
                <br /><Link to={`/produtos/${encodeURIComponent(item.produto.slug)}#avaliacoes`}>★ Avaliar produto</Link>
              </>}
            </dt>
            <dd>{formatarMZN(unitario * item.quantidade)}</dd>
          </div>
        })}
        <div><dt>Subtotal</dt><dd>{formatarMZN(encomenda.valorSubtotal)}</dd></div>
        {Number(encomenda.totalDesconto) > 0 && <div><dt>Descontos</dt><dd>−{formatarMZN(encomenda.totalDesconto)}</dd></div>}
        <div><dt>Entrega</dt><dd>{Number(encomenda.valorFrete) ? formatarMZN(encomenda.valorFrete) : 'Grátis'}</dd></div>
        <div><dt>Total</dt><dd><strong>{formatarMZN(encomenda.valorTotal)}</strong></dd></div>
        {encomenda.valorIva && <div><dt>IVA incluído ({Number(encomenda.taxaIva)}%)</dt><dd>{formatarMZN(encomenda.valorIva)}</dd></div>}
      </dl>
    </div>
    <div className="conta-bloco">
      <h2>Entrega</h2>
      <dl className="conta-dados">
        <div><dt>Destinatário</dt><dd>{encomenda.entregaNomeDestinatario} · {encomenda.entregaTelefone}</dd></div>
        <div><dt>Morada</dt><dd>{morada}</dd></div>
        {encomenda.entregaPontoReferencia && <div><dt>Referência</dt><dd>{encomenda.entregaPontoReferencia}</dd></div>}
        <div><dt>Feita em</dt><dd>{dataLegivel(encomenda.criadoEm)}</dd></div>
      </dl>
    </div>
  </>
}

function AccoesEncomenda({ encomenda, aoActualizar }) {
  const { user } = useAuth()
  const [erroFactura, setErroFactura] = useState('')
  const descarregarFactura = async () => {
    setErroFactura('')
    try {
      await facturasApi.daEncomenda(encomenda.codigoEncomenda, user.email, encomenda.factura.numero)
    } catch (error) {
      setErroFactura(mensagemDeErro(error))
    }
  }
  const [confirmar, setConfirmar] = useState(false)
  const [estado, setEstado] = useState({ aEnviar: false, erro: '', sucesso: '' })
  const [aPagar, setAPagar] = useState(false)
  const { data: formas } = useDadosConta(opcoes => checkoutApi.formasPagamento(opcoes), 'formas-pagamento')
  const codigo = encodeURIComponent(encomenda.codigoEncomenda)
  const paraPagar = { codigoEncomenda: encomenda.codigoEncomenda, valorTotal: encomenda.valorTotal, emailContacto: encomenda.emailContacto || user.email }
  const aoPagar = mensagem => {
    setAPagar(false)
    setEstado({ aEnviar: false, erro: '', sucesso: mensagem })
    aoActualizar()
  }

  const cancelar = async () => {
    setEstado({ aEnviar: true, erro: '', sucesso: '' })
    try {
      const resposta = await clienteApi.cancelarEncomenda(encomenda.codigoEncomenda, user.email)
      setEstado({ aEnviar: false, erro: '', sucesso: resposta.message })
      setConfirmar(false)
      aoActualizar()
    } catch (error) {
      setEstado({ aEnviar: false, erro: mensagemDeErro(error), sucesso: '' })
    }
  }

  return <div className="conta-bloco">
    {estado.sucesso && <p role="status">{estado.sucesso}</p>}
    {estado.erro && <p className="erro" role="alert">{estado.erro}</p>}
    {erroFactura && <p className="erro" role="alert">{erroFactura}</p>}
    {aPagar && <PagarEncomenda
      encomenda={paraPagar}
      formas={formas}
      escolherForma
      onPago={() => aoPagar('Pagamento confirmado. A encomenda está em processamento e a factura já está disponível.')}
      onAnalise={() => aoPagar('Comprovativo recebido. O pagamento está em análise.')}
    />}
    {confirmar
      ? <>
          <p>Cancelar a encomenda {encomenda.codigoEncomenda}? O stock dos produtos é reposto e a operação não pode ser desfeita.</p>
          <div className="conta-links">
            <button type="button" className="botao botao-laranja botao-pequeno" disabled={estado.aEnviar} onClick={cancelar}>
              {estado.aEnviar ? 'A cancelar…' : 'Confirmar cancelamento'}
            </button>
            <button type="button" className="botao botao-claro botao-pequeno" disabled={estado.aEnviar} onClick={() => setConfirmar(false)}>Voltar</button>
          </div>
        </>
      : <div className="conta-links">
          {encomenda.estado === 'REGISTADA' && !aPagar && <button type="button" className="botao botao-laranja" onClick={() => setAPagar(true)}>Pagar encomenda</button>}
          {encomenda.factura && <button type="button" className="botao botao-claro" onClick={descarregarFactura}>Factura {encomenda.factura.numero} (PDF)</button>}
          {CANCELAVEIS.includes(encomenda.estado) && <button type="button" className="botao botao-claro" onClick={() => setConfirmar(true)}>Cancelar encomenda</button>}
          {encomenda.estado === 'CONCLUIDA' && <Link className="botao botao-claro" to={`/conta/devolucoes/nova?encomenda=${codigo}`}>Pedir devolução</Link>}
          <Link className="botao botao-claro" to={`/conta/encomendas/${codigo}/avaliar`}>Avaliar encomenda</Link>
        </div>}
  </div>
}

// Avaliação da experiência e dos produtos (uma vez por encomenda e por produto; só concluídas).
export function RateOrderPage() {
  const { codigo } = useParams()
  const voltar = { to: `/conta/encomendas/${encodeURIComponent(codigo)}`, rotulo: 'Voltar à encomenda' }
  const erroCodigo = validarCodigoEncomenda(codigo)
  return <>
    <ContaCabecalho titulo="Avaliar encomenda" voltar={voltar} />
    {erroCodigo
      ? <FuncionalidadeIndisponivel titulo="Encomenda inválida" accao={botaoConta}>{erroCodigo}</FuncionalidadeIndisponivel>
      : <CarregarAvaliacao codigo={codigo.trim()} />}
  </>
}

function CarregarAvaliacao({ codigo }) {
  const { data, error, loading, recarregar } = useDadosConta(opcoes => contaApi.avaliacaoEncomenda(codigo, opcoes), `avaliacao-${codigo}`)
  return <ResultadoConta loading={loading} error={error} recarregar={recarregar} mensagem="A carregar a encomenda…">
    {data && <FormularioAvaliacao key={JSON.stringify(data)} encomenda={data.encomenda} aoGuardar={recarregar} />}
  </ResultadoConta>
}

const ESTRELA = '\u2605'

function Classificacao({ id, valor, aoMudar }) {
  return <select id={id} value={valor} onChange={e => aoMudar(Number(e.target.value))}>
    <option value={0}>Sem avaliação</option>
    {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{ESTRELA.repeat(n)} ({n})</option>)}
  </select>
}

function FormularioAvaliacao({ encomenda, aoGuardar }) {
  const [experiencia, setExperiencia] = useState({ classificacao: 0, recomenda: true, comentario: '' })
  const [produtos, setProdutos] = useState({})
  const [estado, setEstado] = useState({ aEnviar: false, erro: '', sucesso: '' })

  if (!encomenda.podeAvaliar) {
    return <FuncionalidadeIndisponivel titulo="Ainda não pode avaliar esta encomenda">
      Só é possível avaliar encomendas concluídas. Estado actual: {ESTADOS_ENCOMENDA[encomenda.estado] || encomenda.estado}.
    </FuncionalidadeIndisponivel>
  }

  const porAvaliar = encomenda.itens.filter(item => !item.avaliacao)
  const tudoAvaliado = encomenda.avaliacao && !porAvaliar.length
  const mudarProduto = (id, campo, valor) => setProdutos({ ...produtos, [id]: { ...produtos[id], [campo]: valor } })

  const enviar = async e => {
    e.preventDefault()
    const corpo = {
      experiencia: !encomenda.avaliacao && experiencia.classificacao
        ? { classificacao: experiencia.classificacao, recomenda: experiencia.recomenda, comentario: experiencia.comentario.trim() || undefined }
        : undefined,
      produtos: porAvaliar
        .filter(item => produtos[item.id]?.classificacao)
        .map(item => ({ itemEncomendaId: item.id, classificacao: produtos[item.id].classificacao, comentario: produtos[item.id].comentario?.trim() || undefined })),
    }
    if (!corpo.experiencia && !corpo.produtos.length) return setEstado({ aEnviar: false, erro: 'Dê pelo menos uma classificação.', sucesso: '' })
    setEstado({ aEnviar: true, erro: '', sucesso: '' })
    try {
      const resposta = await contaApi.avaliarEncomenda(encomenda.codigoEncomenda, corpo)
      setEstado({ aEnviar: false, erro: '', sucesso: resposta.message })
      aoGuardar()
    } catch (error) {
      setEstado({ aEnviar: false, erro: mensagemDeErro(error), sucesso: '' })
    }
  }

  return <form className="conta-bloco conta-form" onSubmit={enviar}>
    <h2>Encomenda {encomenda.codigoEncomenda}</h2>
    {estado.sucesso && <p className="sucesso" role="status">{estado.sucesso}</p>}
    {encomenda.avaliacao
      ? <p className="suave">Experiência avaliada: {ESTRELA.repeat(encomenda.avaliacao.classificacaoExperiencia)} · {encomenda.avaliacao.recomenda ? 'Recomenda' : 'Não recomenda'}</p>
      : <>
          <div className="conta-campo">
            <label htmlFor="avaliacao-experiencia">Experiência de compra</label>
            <Classificacao id="avaliacao-experiencia" valor={experiencia.classificacao} aoMudar={classificacao => setExperiencia({ ...experiencia, classificacao })} />
          </div>
          <label className="termos"><input type="checkbox" checked={experiencia.recomenda} onChange={e => setExperiencia({ ...experiencia, recomenda: e.target.checked })} /> Recomendo a loja</label>
          <div className="conta-campo">
            <label htmlFor="avaliacao-comentario">Comentário (opcional)</label>
            <textarea id="avaliacao-comentario" maxLength={2000} value={experiencia.comentario} onChange={e => setExperiencia({ ...experiencia, comentario: e.target.value })} />
          </div>
        </>}
    <h2>Produtos</h2>
    {encomenda.itens.map(item => (
      <div key={item.id} className="conta-campo">
        <label htmlFor={`avaliacao-${item.id}`}>{item.nomeProduto}</label>
        {item.avaliacao
          ? <p className="suave">Avaliado: {ESTRELA.repeat(item.avaliacao.classificacao)}{item.avaliacao.comentario ? ` · ${item.avaliacao.comentario}` : ''}</p>
          : <>
              <Classificacao id={`avaliacao-${item.id}`} valor={produtos[item.id]?.classificacao || 0} aoMudar={valor => mudarProduto(item.id, 'classificacao', valor)} />
              <textarea aria-label={`Comentário sobre ${item.nomeProduto}`} placeholder="Comentário (opcional)" maxLength={2000}
                value={produtos[item.id]?.comentario || ''} onChange={e => mudarProduto(item.id, 'comentario', e.target.value)} />
            </>}
      </div>
    ))}
    {estado.erro && <p className="erro" role="alert">{estado.erro}</p>}
    {tudoAvaliado
      ? <p className="suave">Já avaliou esta encomenda e todos os produtos. Obrigado!</p>
      : <div className="conta-links"><button className="botao botao-laranja" type="submit" disabled={estado.aEnviar}>{estado.aEnviar ? 'A enviar…' : 'Enviar avaliação'}</button></div>}
  </form>
}
