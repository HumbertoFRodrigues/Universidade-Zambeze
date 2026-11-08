import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AVISO_CONTA_EMPRESA, useCarrinho } from '../contexto/CarrinhoContexto.jsx'
import { useAuth } from '../lib/AuthContext.jsx'
import { Foto } from '../components/Foto.jsx'
import { LogoPagamento } from '../components/LogoPagamento.jsx'
import { PagarEncomenda, ajudaForma, logoId } from '../components/pagamento/PagarEncomenda.jsx'
import { formatPrice } from '../services/formatar.js'
import { checkoutApi, facturasApi } from '../services/api.js'
import { usePublicInfo } from '../hooks/usePublicInfo.js'
import '../styles/pagamento.css'

const prazoTexto = dias => (dias === 1 ? '1 dia' : `${dias} dias`)
const novaChave = () => crypto.randomUUID()

export function CheckoutPage() {
  const location = useLocation()
  const { user } = useAuth()
  const { itens, total, tokenSessao, carregando, recarregar, contaEmpresa } = useCarrinho()
  const { regras } = usePublicInfo()
  const prazoDevolucaoDias = regras?.prazoDevolucaoDias

  const [opcoes, setOpcoes] = useState(null)
  const [formas, setFormas] = useState(null)
  const [erroDados, setErroDados] = useState('')
  const [zonaId, setZonaId] = useState('')
  const [modalidadeId, setModalidadeId] = useState('')
  const [cotacao, setCotacao] = useState({ chave: '', dados: null, erro: '' })
  const [formaId, setFormaId] = useState(null)
  const [aceita, setAceita] = useState(false)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [etapa, setEtapa] = useState('dados')
  const [encomenda, setEncomenda] = useState(null)
  const [pagamento, setPagamento] = useState(null)
  const [contaCriada, setContaCriada] = useState(null)
  const chaveIdempotencia = useRef(novaChave())

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      checkoutApi.opcoesEntrega({ signal: controller.signal }),
      checkoutApi.formasPagamento({ signal: controller.signal }),
    ])
      .then(([entrega, formasActivas]) => {
        setOpcoes(entrega.opcoes || [])
        setFormas(formasActivas || [])
        setFormaId(formasActivas?.[0]?.id ?? null)
      })
      .catch(error => {
        if (error.name !== 'AbortError') setErroDados(error.message)
      })
    return () => controller.abort()
  }, [])

  const zonas = useMemo(() => {
    const mapa = new Map()
    for (const opcao of opcoes || []) mapa.set(opcao.zona.id, opcao.zona)
    return [...mapa.values()]
  }, [opcoes])
  const modalidades = (opcoes || []).filter(opcao => String(opcao.zona.id) === zonaId)
  const opcaoEscolhida = modalidades.find(opcao => String(opcao.modalidade.id) === modalidadeId)

  const assinaturaCarrinho = itens.map(i => `${i.itemId}:${i.qtd}`).join(',')
  const chaveCotacao = opcaoEscolhida && itens.length ? `${zonaId}|${modalidadeId}|${assinaturaCarrinho}` : ''
  useEffect(() => {
    if (!chaveCotacao || etapa !== 'dados') return undefined
    const controller = new AbortController()
    const [zona, modalidade] = chaveCotacao.split('|')
    checkoutApi.calcularFrete(
      { tokenSessao, zonaEntregaId: Number(zona), modalidadeEntregaId: Number(modalidade) },
      { signal: controller.signal },
    )
      .then(dados => setCotacao({ chave: chaveCotacao, dados, erro: '' }))
      .catch(error => {
        if (error.name !== 'AbortError') setCotacao({ chave: chaveCotacao, dados: null, erro: error.message })
      })
    return () => controller.abort()
  }, [chaveCotacao, tokenSessao, etapa])
  const cotacaoActual = cotacao.chave === chaveCotacao ? cotacao : { dados: null, erro: '' }

  const forma = (formas || []).find(f => f.id === formaId)

  const escolherZona = id => {
    setZonaId(id)
    const primeira = (opcoes || []).find(opcao => String(opcao.zona.id) === id)
    setModalidadeId(primeira ? String(primeira.modalidade.id) : '')
  }

  const confirmar = async e => {
    e.preventDefault()
    if (!opcaoEscolhida) return setErro('Escolha a zona e a modalidade de entrega.')
    if (!forma) return setErro('Escolha a forma de pagamento.')
    if (!aceita) return setErro('Aceite os termos e condições para continuar.')
    const d = Object.fromEntries(new FormData(e.target))
    setErro('')
    setEnviando(true)
    try {
      const resposta = await checkoutApi.confirmar({
        tokenSessao,
        zonaEntregaId: opcaoEscolhida.zona.id,
        modalidadeEntregaId: opcaoEscolhida.modalidade.id,
        nomeContacto: d.nome,
        emailContacto: d.email,
        telefoneContacto: d.telefone,
        entregaNomeDestinatario: d.nome,
        entregaTelefone: d.telefone,
        entregaLinhaEndereco: d.endereco,
        entregaCidade: d.cidade,
        entregaProvincia: d.provincia,
        entregaPontoReferencia: d.referencia || undefined,
        aceiteTermos: true,
      }, chaveIdempotencia.current)
      chaveIdempotencia.current = novaChave()
      setEncomenda(resposta.encomenda)
      if (resposta.contaCriada) setContaCriada(resposta.contaCriada)
      setEtapa('pagamento')
    } catch (error) {
      setErro(error.message)
    } finally {
      setEnviando(false)
      recarregar()
    }
  }

  const acompanhar = encomenda && user?.email?.toLowerCase() === encomenda.emailContacto
    ? `/conta/encomendas/${encodeURIComponent(encomenda.codigoEncomenda)}`
    : null

  if (encomenda && ['pagamento', 'pago', 'analise'].includes(etapa)) {
    const pago = etapa === 'pago'
    const analise = etapa === 'analise'
    const topo = pago
      ? { classe: 'ok', icone: '✓', titulo: 'Pagamento confirmado', texto: 'foi paga e está em processamento.' }
      : analise
        ? { classe: 'analise', icone: '⏳', titulo: 'Comprovativo recebido — pagamento em análise', texto: 'aguarda a validação da transferência.' }
        : { classe: 'pendente', icone: '…', titulo: 'Encomenda registada — falta o pagamento', texto: 'foi registada e aguarda pagamento.' }
    return <section className="checkout-final">
      <header className={`checkout-final__topo checkout-final__topo--${topo.classe}`}>
        <span className="checkout-final__icone" aria-hidden="true">{topo.icone}</span>
        <div>
          <h1>{topo.titulo}</h1>
          <p>Obrigado, {encomenda.nomeContacto}. A encomenda <b>{encomenda.codigoEncomenda}</b> {topo.texto}</p>
        </div>
      </header>

      <div className="checkout-final__grelha">
        <div className="checkout-final__principal">
          {!pago && !analise && <PagarEncomenda
            encomenda={encomenda}
            formas={formas}
            formaInicialId={formaId}
            abrirAoMontar
            onPago={resposta => { setPagamento(resposta); setEtapa('pago') }}
            onAnalise={resposta => { setPagamento(resposta); setEtapa('analise') }}
          />}

          {analise && <div className="bloco aviso-analise">
            <h2>O que acontece agora</h2>
            <p>A nossa equipa valida a transferência em até 24 horas úteis. Quando o pagamento for confirmado, a encomenda avança para processamento e recebe a factura por email.</p>
            {pagamento?.referenciaOperacao && <p className="nota">Referência do pagamento: <b>{pagamento.referenciaOperacao}</b></p>}
          </div>}

          {pago && pagamento && <div className="bloco">
            <h2>Recibo</h2>
            <p className="nota">Referência do pagamento: <b>{pagamento.referenciaOperacao}</b> ({pagamento.formaPagamento}).</p>
            {pagamento.factura && <button type="button" className="botao botao-claro" onClick={() => facturasApi.daEncomenda(encomenda.codigoEncomenda, encomenda.emailContacto, pagamento.factura.numero).catch(error => setErro(error.message))}>
              Descarregar factura {pagamento.factura.numero} (PDF)
            </button>}
            {erro && <p className="erro" role="alert">{erro}</p>}
          </div>}

          {contaCriada && <div className="bloco conta-criada">
            <h2>A sua conta foi criada</h2>
            <p>Para acompanhar a encomenda, use os dados abaixo:</p>
            <div className="credenciais">
              <div><small>Email</small><b>{contaCriada.email}</b></div>
              <div><small>Palavra-passe</small><b>{contaCriada.palavraPasse}</b></div>
            </div>
            <small className="dica">Recomendamos que altere a palavra-passe após o primeiro acesso.</small>
          </div>}

          <div className="bloco">
            <h2>Próximos passos</h2>
            <ul className="proximos">
              <li>Guarde o código <b>{encomenda.codigoEncomenda}</b>: com ele e o email <b>{encomenda.emailContacto}</b> pode acompanhar a encomenda.</li>
              <li>Vamos contactar <b>{encomenda.telefoneContacto}</b> sobre a entrega.</li>
              {prazoDevolucaoDias && <li>Pode pedir a devolução em {prazoDevolucaoDias} dias, nas condições da <Link to="/info/devolucao">política de devolução</Link>.</li>}
            </ul>
            {acompanhar
              ? <Link className="botao botao-laranja" to={acompanhar}>Ver a encomenda</Link>
              : <Link className="botao botao-claro" to="/produtos">Continuar a comprar</Link>}
          </div>
        </div>

        <aside className="checkout-final__lateral">
          <div className="bloco">
            <h2>Resumo da encomenda</h2>
            {encomenda.itens.map(i => <div key={i.id} className="linha-pedido">
              <span>{i.quantidade} × {i.nomeProduto}</span>
              <b>{formatPrice((Number(i.precoUnitario) - Number(i.descontoUnitario)) * i.quantidade)}</b>
            </div>)}
            {Number(encomenda.totalDesconto) > 0 && <div className="linha-pedido"><span>Descontos</span><b>−{formatPrice(encomenda.totalDesconto)}</b></div>}
            <div className="linha-pedido"><span>Entrega</span><b>{Number(encomenda.valorFrete) ? formatPrice(encomenda.valorFrete) : 'Grátis'}</b></div>
            <div className="linha-pedido total"><span>Total</span><b>{formatPrice(encomenda.valorTotal)}</b></div>
          </div>
        </aside>
      </div>
    </section>
  }

  if (contaEmpresa) {
    return <section className="vazio">
      <h1>Finalizar compra</h1>
      <p>{AVISO_CONTA_EMPRESA}</p>
      <Link className="botao botao-laranja" to="/empresas">Pedir cotação</Link>
    </section>
  }

  if (carregando && !itens.length) {
    return <section className="vazio"><h1>Finalizar compra</h1><p role="status">A carregar o carrinho…</p></section>
  }

  if (!itens.length) {
    return <section className="vazio">
      <h1>Finalizar compra</h1>
      <p>O carrinho está vazio.</p>
      <Link className="botao botao-laranja" to="/produtos">Ver produtos</Link>
    </section>
  }

  const resumo = cotacaoActual.dados
  return <section>
    <h1>Finalizar compra</h1>
    <ol className="etapas" aria-label="Passos da compra">
      <li className="feita">Carrinho</li>
      <li className="atual">Dados e entrega</li>
      <li>Pagamento</li>
      <li>Confirmação</li>
    </ol>

    <div className="finalizar">
      <form className="passos-form" onSubmit={confirmar}>
        <div className="bloco">
          <h2><span>1</span> Os seus dados</h2>
          <div className="duas">
            <input name="nome" required maxLength={150} placeholder="Nome completo" autoComplete="name" defaultValue={user?.nome || ''} />
            <input name="telefone" required maxLength={30} placeholder="Telefone de contacto" autoComplete="tel" defaultValue={user?.telefone || ''} />
          </div>
          <input name="email" type="email" required maxLength={254} placeholder="Email (para acompanhar a encomenda)" autoComplete="email" defaultValue={user?.email || ''} />
          {!user && <small className="dica">Já tem conta? <Link to="/entrar" state={{ from: `${location.pathname}${location.search}${location.hash}` }}>Faça login</Link> para preencher os seus dados automaticamente.</small>}
        </div>

        <div className="bloco">
          <h2><span>2</span> Entrega</h2>
          {erroDados && <p className="erro" role="alert">Não foi possível carregar as opções de entrega e pagamento: {erroDados}</p>}
          {!opcoes && !erroDados && <p role="status">A carregar opções de entrega…</p>}
          {opcoes && !zonas.length && <p className="erro" role="alert">Não há zonas de entrega activas de momento.</p>}
          {zonas.length > 0 && <select value={zonaId} onChange={e => escolherZona(e.target.value)} required aria-label="Zona de entrega">
            <option value="">Escolha a zona de entrega</option>
            {zonas.map(z => <option key={z.id} value={String(z.id)}>{z.nome}</option>)}
          </select>}
          {modalidades.length > 0 && <div className="opcoes-entrega">
            {modalidades.map(o => {
              const id = String(o.modalidade.id)
              return <label key={id} className={modalidadeId === id ? 'ativa' : ''}>
                <input type="radio" name="modalidade" checked={modalidadeId === id} onChange={() => setModalidadeId(id)} />
                <span><b>{o.modalidade.nome}</b><small>Prazo: {prazoTexto(o.prazoDias)}</small></span>
                <strong>{Number(o.frete) ? formatPrice(o.frete) : 'Grátis'}</strong>
              </label>
            })}
          </div>}
          <input name="endereco" required maxLength={255} placeholder="Endereço (bairro, rua, número)" autoComplete="street-address" />
          <div className="duas">
            <input name="cidade" required maxLength={100} placeholder="Cidade" autoComplete="address-level2" />
            <input name="provincia" required maxLength={100} placeholder="Província" autoComplete="address-level1" />
          </div>
          <input name="referencia" maxLength={255} placeholder="Ponto de referência (opcional)" />
          {opcaoEscolhida?.modalidade.levantamentoLoja && <small className="dica">No levantamento na loja, o endereço fica como contacto da encomenda.</small>}
        </div>

        <div className="bloco">
          <h2><span>3</span> Forma de pagamento</h2>
          {formas && !formas.length && <p className="erro" role="alert">Não há formas de pagamento activas de momento.</p>}
          {formas?.length > 0 && <div className="metodos">
            {formas.map(f => {
              const fId = logoId(f)
              return <button key={f.id} type="button" className={formaId === f.id ? 'ativa' : ''} onClick={() => { setFormaId(f.id); setErro('') }}>
                {fId ? <LogoPagamento id={fId} /> : <span className="selo">{f.nome}</span>}
                <span><b>{f.nome}</b><small>{ajudaForma(f)}</small></span>
              </button>
            })}
          </div>}
          <label className="termos"><input type="checkbox" checked={aceita} onChange={e => setAceita(e.target.checked)} /> Li e aceito os <Link to="/info/termos" target="_blank">termos e condições</Link> e a <Link to="/info/privacidade" target="_blank">política de privacidade</Link>.</label>
          {erro && <p className="erro" role="alert">{erro}</p>}
          <button className="botao botao-laranja grande" type="submit" disabled={enviando || !resumo}>
            {enviando ? 'A registar a encomenda…' : resumo ? `Confirmar encomenda de ${formatPrice(resumo.total)}` : 'Confirmar encomenda'}
          </button>
        </div>
      </form>

      <aside className="lateral">
        <div className="bloco">
          <h2>O seu pedido</h2>
          {itens.map(i => {
            const linha = resumo?.itens.find(x => x.produtoId === i.produto.id)
            return <div key={i.chave} className="linha-resumo">
              <div className="mini"><Foto produto={i.produto} /></div>
              <span>{i.qtd} × {i.produto.nome}{linha?.promocao && <small>{linha.promocao}</small>}</span>
              <b>{formatPrice(linha ? linha.subtotal : i.preco * i.qtd)}</b>
            </div>
          })}
          <div className="linha-pedido"><span>Produtos</span><b>{formatPrice(resumo ? resumo.subtotal : total)}</b></div>
          {resumo && Number(resumo.desconto) > 0 && <div className="linha-pedido"><span>Descontos</span><b>−{formatPrice(resumo.desconto)}</b></div>}
          <div className="linha-pedido"><span>Entrega</span><b>{resumo ? (Number(resumo.frete) ? formatPrice(resumo.frete) : 'Grátis') : 'Escolha a entrega'}</b></div>
          <div className="linha-pedido total"><span>Total</span><b>{resumo ? formatPrice(resumo.total) : '—'}</b></div>
          {resumo && <div className="linha-pedido"><span><small>IVA incluído ({resumo.taxaIva}%)</small></span><b><small>{formatPrice(resumo.ivaIncluido)}</small></b></div>}
          {chaveCotacao && !resumo && !cotacaoActual.erro && <p className="nota" role="status">A calcular o total…</p>}
          {cotacaoActual.erro && <p className="erro" role="alert">{cotacaoActual.erro}</p>}
        </div>
      </aside>
    </div>
  </section>
}
