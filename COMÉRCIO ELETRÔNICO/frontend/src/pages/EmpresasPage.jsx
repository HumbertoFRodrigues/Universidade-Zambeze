import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FormCotacao } from '../components/FormCotacao.jsx'
import { useDadosConta } from '../hooks/useDadosConta.js'
import { useEmpresa } from '../hooks/useEmpresa.js'
import { usePublicInfo } from '../hooks/usePublicInfo.js'
import { checkoutApi, cotacoesApi, facturasApi } from '../services/api.js'
import { PagarEncomenda } from '../components/pagamento/PagarEncomenda.jsx'
import { precoComDesconto, textoEscalao } from '../services/comercio.js'
import { formatPrice } from '../services/formatar.js'
import '../styles/empresas.css'

// Estados das cotações (estado_cotacao) e a classe visual existente correspondente.
const ESTADOS = {
  PEDIDA: ['Pedida', 'estado-analise'],
  RESPONDIDA: ['Proposta recebida', 'estado-proposta'],
  ACEITE: ['Aceite', 'estado-aceite'],
  RECUSADA: ['Recusada', ''],
  EXPIRADA: ['Expirada', ''],
}

const data = valor => (valor ? new Date(valor).toLocaleDateString('pt-PT') : '')

export function EmpresasPage() {
  const { regras, loading } = usePublicInfo()
  const { contaEmpresa, empresa, aprovada } = useEmpresa()
  const escaloes = regras?.atacado || []
  const [versao, setVersao] = useState(0)

  return <section className="empresas">
    {!contaEmpresa && <p className="nota">
      É uma empresa ou revendedor? <Link to="/register">Crie uma conta de empresa</Link>: depois de aprovada pela loja, pode pedir cotações.
    </p>}
    <div className="duas-colunas">
      <div>
        <h2>Quanto mais compra, menos paga</h2>
        {loading ? <p role="status">A carregar condições comerciais…</p> : <ul className="escaloes">
          {escaloes.map(e => (
            <li key={e.de}>
              <span className="escalao-qtd">{textoEscalao(e)} unidades</span>
              <b>{e.desconto ? '-' + Math.round(e.desconto * 100) + '%' : 'Preço normal'}</b>
              <small>{formatPrice(precoComDesconto(1000, e.de, escaloes))} em 1 000 MT</small>
            </li>
          ))}
        </ul>}
        <p className="nota">Os descontos por quantidade são aplicados automaticamente no checkout. Para quantidades especiais, as empresas pedem uma cotação.</p>
      </div>
      <div>
        <h2>Pedir cotação</h2>
        <FormCotacao aoCriar={() => setVersao(v => v + 1)} />
      </div>
    </div>

    {contaEmpresa && <>
      <h2>Os seus pedidos de cotação</h2>
      <ListaCotacoes key={versao} empresa={empresa} podeAceitar={aprovada} />
    </>}
  </section>
}

function ListaCotacoes({ empresa, podeAceitar }) {
  const { data: resposta, error, loading, recarregar } = useDadosConta(opcoes => cotacoesApi.listar({ limite: 50 }, opcoes), 'cotacoes')
  if (loading) return <p role="status">A carregar cotações…</p>
  if (error) return <p className="erro" role="alert">{error} <button type="button" className="link" onClick={recarregar}>Tentar novamente</button></p>
  const cotacoes = resposta?.cotacoes || []
  if (!cotacoes.length) return <p className="nota">Ainda não fez nenhum pedido. Quando fizer, acompanha aqui a resposta da loja.</p>
  return <ul className="lista-cotacoes">
    {cotacoes.map(c => <Cotacao key={c.id} cotacao={c} empresa={empresa} podeAceitar={podeAceitar} aoMudar={recarregar} />)}
  </ul>
}

// Pagamento da encomenda criada pela cotação: o mesmo fluxo do checkout (M-Pesa, e-Mola, cartão,
// transferência com comprovativo ou numerário).
function PagamentoCotacao({ encomenda, abrir, aoMudar }) {
  const { data: formas } = useDadosConta(opcoes => checkoutApi.formasPagamento(opcoes), 'formas-pagamento')
  const [aPagar, setAPagar] = useState(abrir)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState('')
  const pago = ['EM_PROCESSAMENTO', 'CONCLUIDA'].includes(encomenda.estado)
  const ligacao = <Link to={`/conta/encomendas/${encodeURIComponent(encomenda.codigoEncomenda)}`}>{encomenda.codigoEncomenda}</Link>
  const factura = resultado?.factura?.numero || encomenda.factura?.numero
  const descarregar = () => facturasApi.daEncomenda(encomenda.codigoEncomenda, encomenda.emailContacto, factura).catch(error => setErro(error.message))

  if (resultado?.analise) {
    return <div className="pagamento-cotacao pagamento-cotacao--analise">
      <p><b>Comprovativo recebido.</b> O pagamento da encomenda {ligacao} está em análise; a factura é emitida depois da validação.</p>
    </div>
  }
  if (pago || resultado) {
    return <div className="pagamento-cotacao pagamento-cotacao--pago">
      <p><b>Encomenda {ligacao} paga</b> ({formatPrice(encomenda.valorTotal)}). Está em processamento.</p>
      {factura && <button type="button" className="botao botao-claro botao-pequeno" onClick={descarregar}>Descarregar factura {factura} (PDF)</button>}
      {erro && <p className="erro" role="alert">{erro}</p>}
    </div>
  }
  return <div className="pagamento-cotacao">
    <p>Encomenda {ligacao} criada — total <b>{formatPrice(encomenda.valorTotal)}</b> (inclui a entrega). Falta o pagamento.</p>
    {!aPagar && <button type="button" className="botao botao-laranja botao-pequeno" onClick={() => setAPagar(true)}>Pagar agora</button>}
    {aPagar && <PagarEncomenda
      encomenda={encomenda}
      formas={formas}
      escolherForma
      onPago={resposta => { setResultado(resposta); aoMudar() }}
      onAnalise={resposta => setResultado({ ...resposta, analise: true })}
    />}
  </div>
}

function Cotacao({ cotacao: c, empresa, podeAceitar, aoMudar }) {
  const [aAceitar, setAAceitar] = useState(false)
  const [acabouDeAceitar, setAcabouDeAceitar] = useState('')
  const [estado, setEstado] = useState({ aEnviar: false, erro: '' })
  const [rotulo, classe] = ESTADOS[c.estado] || [c.estado, '']

  const recusar = async () => {
    if (!window.confirm(`Recusar a proposta ${c.codigo}?`)) return
    setEstado({ aEnviar: true, erro: '' })
    try {
      await cotacoesApi.recusar(c.id)
      aoMudar()
    } catch (error) {
      setEstado({ aEnviar: false, erro: error.message })
    }
  }

  return <li>
    <div className="cotacao-topo">
      <div><b>{c.codigo}</b><small>Pedida em {data(c.criadoEm)}{c.validaAte ? ` · proposta válida até ${data(c.validaAte)}` : ''}</small></div>
      <span className={`estado ${classe}`}>{rotulo}</span>
    </div>
    <ul className="itens-cotacao">
      {c.itens.map(item => (
        <li key={item.id}>
          {item.quantidade} × <Link to={`/produtos/${encodeURIComponent(item.produto.slug)}`}>{item.produto.nome}</Link>
          {item.precoPedido && <small> · pedido {formatPrice(item.precoPedido)}/un.</small>}
          {item.precoProposto && <b> · proposta {formatPrice(item.precoProposto)}/un. ({formatPrice(Number(item.precoProposto) * item.quantidade)})</b>}
        </li>
      ))}
    </ul>
    {c.notasCliente && <p className="mensagem-cliente">Notas: {c.notasCliente}</p>}
    {c.estado === 'RESPONDIDA' && <div className="proposta">
      <p>Proposta da loja: <b>{formatPrice(c.totalProposto)}</b> pelos produtos (a entrega é somada ao aceitar).</p>
      {c.notasLoja && <p>Notas da loja: {c.notasLoja}</p>}
      {podeAceitar && !aAceitar && <div className="botoes">
        <button type="button" className="botao botao-laranja botao-pequeno" onClick={() => setAAceitar(true)}>Aceitar proposta</button>
        <button type="button" className="botao botao-claro botao-pequeno" disabled={estado.aEnviar} onClick={recusar}>Recusar</button>
      </div>}
      {aAceitar && <AceitarProposta cotacao={c} empresa={empresa} aoCancelar={() => setAAceitar(false)} aoAceitar={mensagem => { setAcabouDeAceitar(mensagem || 'Proposta aceite.'); aoMudar() }} />}
    </div>}
    {acabouDeAceitar && <p className="sucesso" role="status">{acabouDeAceitar}</p>}
    {c.estado === 'ACEITE' && c.encomenda && <PagamentoCotacao encomenda={c.encomenda} abrir={Boolean(acabouDeAceitar)} aoMudar={aoMudar} />}
    {estado.erro && <p className="erro" role="alert">{estado.erro}</p>}
  </li>
}

// Aceitar: a empresa indica a entrega; o servidor cria a encomenda com os preços da proposta.
function AceitarProposta({ cotacao, empresa, aoCancelar, aoAceitar }) {
  const { data: opcoesEntrega } = useDadosConta(opcoes => checkoutApi.opcoesEntrega(opcoes), 'opcoes-entrega')
  const [zonaId, setZonaId] = useState('')
  const [modalidadeId, setModalidadeId] = useState('')
  const [campos, setCampos] = useState({
    entregaLinhaEndereco: [empresa?.rua, empresa?.bairro].filter(Boolean).join(', '),
    entregaCidade: empresa?.cidade || '',
    entregaProvincia: empresa?.provincia || '',
    entregaPontoReferencia: '',
  })
  const [aceita, setAceita] = useState(false)
  const [estado, setEstado] = useState({ aEnviar: false, erro: '' })

  const opcoes = useMemo(() => opcoesEntrega?.opcoes || [], [opcoesEntrega])
  const zonas = useMemo(() => [...new Map(opcoes.map(o => [o.zona.id, o.zona])).values()], [opcoes])
  const modalidades = opcoes.filter(o => String(o.zona.id) === zonaId)
  const escolhida = modalidades.find(o => String(o.modalidade.id) === modalidadeId)

  const confirmar = async e => {
    e.preventDefault()
    if (!escolhida) return setEstado({ aEnviar: false, erro: 'Escolha a zona e a modalidade de entrega.' })
    if (!aceita) return setEstado({ aEnviar: false, erro: 'Aceite os termos e condições para continuar.' })
    setEstado({ aEnviar: true, erro: '' })
    try {
      const resposta = await cotacoesApi.aceitar(cotacao.id, {
        zonaEntregaId: escolhida.zona.id,
        modalidadeEntregaId: escolhida.modalidade.id,
        ...campos,
        entregaPontoReferencia: campos.entregaPontoReferencia || undefined,
        aceiteTermos: true,
      })
      aoAceitar(resposta?.message)
    } catch (error) {
      setEstado({ aEnviar: false, erro: error.message })
    }
  }

  return <form className="form-cotacao" onSubmit={confirmar}>
    <label>Zona de entrega
      <select required value={zonaId} onChange={e => { setZonaId(e.target.value); setModalidadeId('') }}>
        <option value="">Escolha a zona</option>
        {zonas.map(z => <option key={z.id} value={String(z.id)}>{z.nome}</option>)}
      </select>
    </label>
    <label>Modalidade
      <select required value={modalidadeId} onChange={e => setModalidadeId(e.target.value)} disabled={!zonaId}>
        <option value="">Escolha a modalidade</option>
        {modalidades.map(o => <option key={o.modalidade.id} value={String(o.modalidade.id)}>{o.modalidade.nome} · {Number(o.frete) ? formatPrice(o.frete) : 'Grátis'}</option>)}
      </select>
    </label>
    <label className="larga">Endereço de entrega
      <input required maxLength={255} value={campos.entregaLinhaEndereco} onChange={e => setCampos({ ...campos, entregaLinhaEndereco: e.target.value })} />
    </label>
    <label>Cidade<input required maxLength={100} value={campos.entregaCidade} onChange={e => setCampos({ ...campos, entregaCidade: e.target.value })} /></label>
    <label>Província<input required maxLength={100} value={campos.entregaProvincia} onChange={e => setCampos({ ...campos, entregaProvincia: e.target.value })} /></label>
    <label className="larga">Ponto de referência (opcional)
      <input maxLength={255} value={campos.entregaPontoReferencia} onChange={e => setCampos({ ...campos, entregaPontoReferencia: e.target.value })} />
    </label>
    <p className="preco-referencia">Total: <b>{formatPrice(Number(cotacao.totalProposto) + (escolhida ? Number(escolhida.frete) : 0))}</b> {escolhida ? '(com entrega)' : '(sem entrega)'}</p>
    <label className="larga"><span><input type="checkbox" checked={aceita} onChange={e => setAceita(e.target.checked)} /> Li e aceito os <Link to="/info/termos" target="_blank">termos e condições</Link>.</span></label>
    {estado.erro && <p className="erro larga" role="alert">{estado.erro}</p>}
    <div className="botoes larga">
      <button className="botao botao-laranja botao-pequeno" type="submit" disabled={estado.aEnviar}>{estado.aEnviar ? 'A criar encomenda…' : 'Confirmar e criar encomenda'}</button>
      <button className="link" type="button" onClick={aoCancelar}>Cancelar</button>
    </div>
  </form>
}
