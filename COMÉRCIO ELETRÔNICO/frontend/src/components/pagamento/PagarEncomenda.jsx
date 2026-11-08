import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LogoPagamento } from '../LogoPagamento.jsx'
import { formatPrice } from '../../services/formatar.js'
import { checkoutApi } from '../../services/api.js'
import '../../styles/pagamento.css'

// Pagamento de uma encomenda já registada: usado no checkout e nas encomendas criadas por cotação (empresas).
// M-Pesa: API real. e-Mola e cartão: simulados (sem credenciais do operador). Transferência: comprovativo
// em análise. Numerário: confirmação na entrega.

export const TELEMOVEL = {
  mpesa: { regra: /^8[45]\d{7}$/, prefixos: '84 ou 85', ajuda: 'Recebe um pedido no telemóvel e confirma com o PIN M-Pesa.' },
  emola: { regra: /^8[67]\d{7}$/, prefixos: '86 ou 87', ajuda: 'Recebe um pedido no telemóvel e confirma com o PIN e-Mola.' },
}

// Contas de demonstração (fictícias). Titular, NIB e IBAN não correspondem a contas reais.
const TITULAR = 'EasyShop — Loja de Segurança e Proteção, Lda'
const CONTAS_BANCARIAS = [
  { banco: 'BCI — Banco Comercial e de Investimentos', conta: '1234567890001', nib: '0008 0000 1234 5678 900 13', iban: 'MZ59 0008 0000 1234 5678 9001 3', swift: 'CGDIMZMA' },
  { banco: 'Millennium BIM', conta: '987654321', nib: '0001 0000 0987 6543 210 57', iban: 'MZ59 0001 0000 0987 6543 2105 7', swift: 'BIMOMZMX' },
  { banco: 'Standard Bank Moçambique', conta: '1088765432101', nib: '0003 0108 8765 4321 010 61', iban: 'MZ59 0003 0108 8765 4321 0106 1', swift: 'SBICMZMX' },
]

// Tempo e textos do modal de espera por método. O M-Pesa espera pela API real (até 150 s).
const ESPERA = {
  mpesa: { segundos: 150, titulo: 'Confirme o pagamento no seu telemóvel', aguardar: 'A aguardar a sua confirmação...' },
  emola: { segundos: 10, titulo: 'Confirme o pagamento no seu telemóvel', aguardar: 'A aguardar a sua confirmação...' },
  cartao: { segundos: 6, titulo: 'A confirmar o pagamento com o banco', aguardar: 'A aguardar a autorização do banco...' },
}

const soDigitos = texto => String(texto || '').replace(/\D/g, '')
const cartaoValido = ({ numero, validade, cvv, titular }) => {
  const digitos = soDigitos(numero)
  // Pagamento por cartão simulado: aceita qualquer número de 16 dígitos (sem verificação de Luhn).
  if (digitos.length !== 16) return 'O número do cartão deve ter 16 dígitos.'
  const [mes, ano] = validade.split('/').map(Number)
  const fim = new Date(2000 + ano, mes)
  if (!mes || mes > 12 || !ano || fim <= new Date()) return 'Validade inválida ou expirada (use MM/AA, por exemplo 12/28).'
  if (!/^\d{3}$/.test(cvv)) return 'O CVV deve ter 3 dígitos.'
  if (titular.trim().length < 3) return 'Indique o nome que aparece no cartão.'
  return ''
}
const formatarCartao = valor => soDigitos(valor).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
const formatarValidade = valor => {
  const d = soDigitos(valor).slice(0, 4)
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
}

export function tipoForma(forma) {
  const nome = (forma?.nome || '').toLowerCase()
  if (nome.includes('m-pesa') || nome.includes('mpesa')) return 'mpesa'
  if (nome.includes('e-mola') || nome.includes('emola')) return 'emola'
  if (nome.includes('cartão') || nome.includes('cartao') || nome.includes('visa')) return 'cartao'
  if (nome.includes('transferência') || nome.includes('transferencia') || nome.includes('banco')) return 'banco'
  if (nome.includes('numerário') || nome.includes('numerario') || nome.includes('contra')) return 'numerario'
  return null
}

export const logoId = forma => tipoForma(forma) || null

export function ajudaForma(forma) {
  const tipo = tipoForma(forma)
  return tipo === 'mpesa' || tipo === 'emola' ? TELEMOVEL[tipo].ajuda
    : tipo === 'cartao' ? 'Pague com cartão Visa ou Mastercard.'
      : tipo === 'banco' ? 'Transfira para a nossa conta bancária.'
        : tipo === 'numerario' ? 'Pague em dinheiro no momento da entrega.'
          : 'Confirmação do pagamento depois de registar a encomenda.'
}

function mascaraTelefone(numero) {
  const limpo = String(numero || '').replace(/\D/g, '')
  if (limpo.length >= 9) {
    const prefixo = limpo.slice(limpo.length - 9, limpo.length - 9 + 2)
    const fim = limpo.slice(-4)
    return `${prefixo} ••• ${fim}`
  }
  return numero
}

function EsperaPagamento({ tipo, numero, valor, encomenda, forma, onSucesso, onTentar, onFechar }) {
  const config = ESPERA[tipo] || ESPERA.emola
  const [segundos, setSegundos] = useState(config.segundos)
  const [estado, setEstado] = useState('aguardando')
  const [erroMsg, setErroMsg] = useState('')
  const controllerRef = useRef(null)
  const nome = tipo === 'mpesa' ? 'M-Pesa' : tipo === 'emola' ? 'e-Mola' : 'cartão'

  useEffect(() => {
    if (estado !== 'aguardando') return undefined
    const intervalo = setInterval(() => setSegundos(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(intervalo)
  }, [estado])

  useEffect(() => {
    controllerRef.current = new AbortController()
    const dados = {
      codigoEncomenda: encomenda.codigoEncomenda,
      formaPagamentoId: forma.id,
      valorPago: encomenda.valorTotal,
      emailContacto: encomenda.emailContacto,
    }
    // M-Pesa: API real. e-Mola e cartão: sem credenciais do operador, confirmam por simulação após a espera.
    const pedido = tipo === 'mpesa'
      ? checkoutApi.pagarMpesa({ ...dados, telefone: numero }, controllerRef.current.signal)
      : new Promise(resolve => setTimeout(resolve, config.segundos * 1000)).then(() => checkoutApi.simularPagamento(dados))
    pedido
      .then(resp => {
        setEstado('sucesso')
        setTimeout(() => onSucesso(resp), 2000)
      })
      .catch(err => {
        if (err.name === 'AbortError') return
        setEstado('erro')
        setErroMsg(err.message || 'Erro ao processar pagamento.')
      })
    return () => controllerRef.current?.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const minutos = Math.floor(segundos / 60)
  const segs = String(segundos % 60).padStart(2, '0')
  const progresso = Math.max(0, (segundos / config.segundos) * 100)

  if (estado === 'sucesso') {
    return <div className={`espera-mpesa espera-mpesa--${tipo}`}>
      <div className="espera-logo"><LogoPagamento id={tipo} /></div>
      <div className="espera-visto">✓</div>
      <h2>Pagamento confirmado!</h2>
      <p className="espera-sub">Obrigado. O recibo segue para o seu email. A abrir a confirmação...</p>
    </div>
  }

  if (estado === 'erro') {
    return <div className={`espera-mpesa espera-mpesa--${tipo}`}>
      <div className="espera-logo"><LogoPagamento id={tipo} /></div>
      <div className="espera-falha">✕</div>
      <h2>Pagamento não confirmado</h2>
      <p className="espera-erro">{erroMsg}</p>
      <button type="button" className="botao botao-laranja grande" onClick={onTentar}>Tentar novamente</button>
      <button type="button" className="espera-fechar" onClick={onFechar}>Escolher outra forma de pagamento</button>
    </div>
  }

  return <div className={`espera-mpesa espera-mpesa--${tipo}`}>
    <div className="espera-logo"><LogoPagamento id={tipo} /></div>
    <h2>{config.titulo}</h2>
    <p className="espera-sub">{tipo === 'cartao'
      ? `Estamos a validar o cartão terminado em ${numero} junto do banco emissor.`
      : `Enviámos um pedido de pagamento ${nome} para o número ${mascaraTelefone(numero)}.`}</p>
    <div className="espera-valor">{formatPrice(valor)}</div>
    {tipo === 'cartao'
      ? <ol className="espera-passos">
        <li><span className="passo-num">1</span> O banco verifica o cartão e o saldo disponível.</li>
        <li><span className="passo-num">2</span> Código SMS (3-D Secure) confirmado com sucesso.</li>
        <li><span className="passo-num">3</span> Aguarde aqui: confirmamos sozinhos e enviamos o recibo.</li>
      </ol>
      : <ol className="espera-passos">
        <li><span className="passo-num">1</span> Desbloqueie o telemóvel: aparece a janela do {nome}.</li>
        <li><span className="passo-num">2</span> Confira o valor e escreva o seu PIN {nome}.</li>
        <li><span className="passo-num">3</span> Aguarde aqui: confirmamos sozinhos e enviamos o recibo.</li>
      </ol>}
    <div className="espera-progresso"><div className="espera-barra" style={{ width: `${progresso}%` }} /></div>
    <p className="espera-tempo"><span className="roda-mini" /> {config.aguardar} {minutos}:{segs}</p>
    <p className="espera-aviso">{tipo === 'cartao'
      ? 'Não feche nem recarregue esta página. Os dados do cartão não são guardados pela EasyShop.'
      : 'Não feche nem recarregue esta página enquanto confirma. Não recebeu o pedido? Verifique se o telemóvel tem rede e saldo, e aguarde alguns segundos.'}</p>
  </div>
}

// encomenda: { codigoEncomenda, valorTotal, emailContacto }. formas: formas de pagamento activas.
// formaInicialId fixa a forma escolhida antes (checkout); escolherForma mostra a escolha aqui (empresas).
// abrirAoMontar abre logo o modal para M-Pesa, e-Mola e cartão.
export function PagarEncomenda({ encomenda, formas, formaInicialId = null, escolherForma = false, abrirAoMontar = false, onPago, onAnalise }) {
  const [formaId, setFormaId] = useState(formaInicialId ?? (escolherForma ? null : formas?.[0]?.id ?? null))
  const forma = (formas || []).find(f => f.id === formaId)
  const tipo = tipoForma(forma)
  const telemovel = TELEMOVEL[tipo]
  const [numero, setNumero] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [faseModal, setFaseModal] = useState(() => (abrirAoMontar && (telemovel || tipo === 'cartao') ? 'dados' : null))
  const [tentativa, setTentativa] = useState(0)
  const [cartao, setCartao] = useState({ numero: '', validade: '', cvv: '', titular: '' })
  const [codigoSms, setCodigoSms] = useState('')
  const [comprovativo, setComprovativo] = useState(null)

  const pagar = async () => {
    setErro('')
    setEnviando(true)
    try {
      const resposta = await checkoutApi.simularPagamento({
        codigoEncomenda: encomenda.codigoEncomenda,
        formaPagamentoId: forma.id,
        valorPago: encomenda.valorTotal,
        emailContacto: encomenda.emailContacto,
      })
      onPago(resposta)
    } catch (error) {
      setErro(error.message)
    } finally {
      setEnviando(false)
    }
  }

  const aoConfirmar = resposta => {
    setFaseModal(null)
    onPago(resposta)
  }

  const fecharModal = () => setFaseModal(null)

  const abrirModal = () => {
    setErro('')
    setFaseModal('dados')
  }

  // Valida o número ou o cartão no modal e passa para o ecrã de processamento.
  const pagarNoModal = e => {
    e.preventDefault()
    if (telemovel && !telemovel.regra.test(soDigitos(numero))) {
      return setErro(`Número ${forma.nome} inválido. Use um número que comece por ${telemovel.prefixos}.`)
    }
    if (tipo === 'cartao') {
      const problema = cartaoValido(cartao)
      if (problema) return setErro(problema)
      setErro('')
      setCodigoSms('')
      return setFaseModal('3ds')
    }
    setErro('')
    setTentativa(t => t + 1)
    setFaseModal('espera')
  }

  // 3-D Secure (simulado): qualquer código de 6 dígitos é aceite.
  const confirmarCodigoSms = e => {
    e.preventDefault()
    if (!/^\d{6}$/.test(codigoSms)) return setErro('Introduza o código de 6 dígitos que recebeu por SMS.')
    setErro('')
    setTentativa(t => t + 1)
    setFaseModal('espera')
  }

  const enviarComprovativo = async () => {
    if (!comprovativo) return setErro('Escolha o ficheiro do comprovativo.')
    if (comprovativo.size > 3 * 1024 * 1024) return setErro('O comprovativo deve ter no máximo 3 MB.')
    setErro('')
    setEnviando(true)
    try {
      const resposta = await checkoutApi.enviarComprovativo({
        codigoEncomenda: encomenda.codigoEncomenda,
        emailContacto: encomenda.emailContacto,
        formaPagamentoId: forma.id,
      }, comprovativo)
      onAnalise?.(resposta)
    } catch (error) {
      setErro(error.message)
    } finally {
      setEnviando(false)
    }
  }

  const copiar = texto => {
    navigator.clipboard?.writeText(texto).catch(() => {})
  }

  const modal = faseModal && forma && createPortal(
    <div className="modal-pagamento" role="dialog" aria-modal="true" aria-label={`Pagamento ${forma?.nome || ''}`}>
      {faseModal === 'dados'
        ? <form className={`espera-mpesa espera-mpesa--${tipo}`} onSubmit={pagarNoModal} noValidate>
          <div className="espera-logo"><LogoPagamento id={tipo} /></div>
          <h2>Pagar com {forma?.nome}</h2>
          <div className="espera-valor">{formatPrice(encomenda.valorTotal)}</div>
          <p className="espera-sub">Encomenda {encomenda.codigoEncomenda}</p>
          {telemovel && <label className="modal-campo">Número {forma.nome}
            <input autoFocus inputMode="numeric" maxLength={9} value={numero} onChange={e => setNumero(soDigitos(e.target.value).slice(0, 9))} placeholder={`${telemovel.prefixos === '84 ou 85' ? '84' : '86'} 123 4567`} />
            <small>Use um número {telemovel.prefixos}. Vai receber o pedido no telemóvel para confirmar com o PIN.</small>
          </label>}
          {tipo === 'cartao' && <div className="form-cartao modal-cartao">
            <label>Número do cartão
              <input autoFocus value={cartao.numero} onChange={e => setCartao(c => ({ ...c, numero: formatarCartao(e.target.value) }))} placeholder="0000 0000 0000 0000" inputMode="numeric" autoComplete="cc-number" />
            </label>
            <div className="duas">
              <label>Validade
                <input value={cartao.validade} onChange={e => setCartao(c => ({ ...c, validade: formatarValidade(e.target.value) }))} placeholder="MM/AA" inputMode="numeric" autoComplete="cc-exp" />
              </label>
              <label>CVV
                <input value={cartao.cvv} onChange={e => setCartao(c => ({ ...c, cvv: soDigitos(e.target.value).slice(0, 3) }))} placeholder="123" inputMode="numeric" autoComplete="cc-csc" />
              </label>
            </div>
            <label>Nome no cartão
              <input value={cartao.titular} onChange={e => setCartao(c => ({ ...c, titular: e.target.value.slice(0, 100) }))} placeholder="Como aparece no cartão" autoComplete="cc-name" />
            </label>
          </div>}
          {erro && <p className="espera-erro" role="alert">{erro}</p>}
          <button type="submit" className="botao botao-laranja grande modal-pagar">Pagar {formatPrice(encomenda.valorTotal)}</button>
          <button type="button" className="espera-fechar" onClick={fecharModal}>Cancelar</button>
        </form>
        : faseModal === '3ds'
          ? <form className="espera-mpesa espera-mpesa--cartao" onSubmit={confirmarCodigoSms} noValidate>
            <div className="espera-logo"><LogoPagamento id="cartao" /></div>
            <span className="selo-3ds">Visa Secure · Mastercard ID Check</span>
            <h2>Confirme a compra com o código SMS</h2>
            <p className="espera-sub">O seu banco enviou um código de 6 dígitos por SMS para o telemóvel associado ao cartão terminado em <b>{soDigitos(cartao.numero).slice(-4)}</b>.</p>
            <div className="dados-3ds">
              <div><small>Comerciante</small><b>EasyShop</b></div>
              <div><small>Valor</small><b>{formatPrice(encomenda.valorTotal)}</b></div>
              <div><small>Data</small><b>{new Date().toLocaleDateString('pt-MZ')}</b></div>
            </div>
            <label className="modal-campo">Código de verificação
              <input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codigoSms} onChange={e => setCodigoSms(soDigitos(e.target.value).slice(0, 6))} placeholder="••••••" />
              <small>O código é válido por 5 minutos. Não o partilhe com ninguém.</small>
            </label>
            {erro && <p className="espera-erro" role="alert">{erro}</p>}
            <button type="submit" className="botao botao-laranja grande modal-pagar">Confirmar pagamento</button>
            <button type="button" className="espera-fechar" onClick={() => setCodigoSms('')}>Reenviar código</button>
            <button type="button" className="espera-fechar" onClick={fecharModal}>Cancelar</button>
          </form>
          : <EsperaPagamento
            key={tentativa}
            tipo={tipo}
            numero={tipo === 'cartao' ? soDigitos(cartao.numero).slice(-4) : numero}
            valor={Number(encomenda.valorTotal)}
            encomenda={encomenda}
            forma={forma}
            onSucesso={aoConfirmar}
            onTentar={abrirModal}
            onFechar={fecharModal}
          />}
    </div>,
    document.body,
  )

  return <div className="bloco bloco-pagamento">
    {modal}
    {escolherForma && <>
      <h2>Escolha a forma de pagamento</h2>
      {formas && !formas.length && <p className="erro" role="alert">Não há formas de pagamento activas de momento.</p>}
      {!formas && <p role="status">A carregar formas de pagamento…</p>}
      {formas?.length > 0 && <div className="metodos">
        {formas.map(f => {
          const fId = logoId(f)
          return <button key={f.id} type="button" className={formaId === f.id ? 'ativa' : ''} onClick={() => { setFormaId(f.id); setErro(''); setComprovativo(null) }}>
            {fId ? <LogoPagamento id={fId} /> : <span className="selo">{f.nome}</span>}
            <span><b>{f.nome}</b><small>{ajudaForma(f)}</small></span>
          </button>
        })}
      </div>}
    </>}

    {forma && <>
      <div className="bloco-pagamento__cab">
        {logoId(forma) && <LogoPagamento id={logoId(forma)} />}
        <div>
          <h2>Pagamento com {forma.nome}</h2>
          <p>Total a pagar <strong>{formatPrice(encomenda.valorTotal)}</strong></p>
        </div>
      </div>

      {(telemovel || tipo === 'cartao') && <>
        <p>{tipo === 'cartao'
          ? 'Pague com cartão Visa ou Mastercard. Os dados do cartão não são guardados pela EasyShop.'
          : `Indique o seu número ${forma.nome} e confirme o pagamento no telemóvel com o seu PIN.`}</p>
        <button type="button" className="botao botao-laranja grande" onClick={abrirModal}>
          Pagar {formatPrice(encomenda.valorTotal)} com {forma.nome}
        </button>
      </>}

      {tipo === 'banco' && <>
        <p>Transfira <b>{formatPrice(encomenda.valorTotal)}</b> para uma das contas abaixo e indique a referência <b>{encomenda.codigoEncomenda}</b> no descritivo. Depois envie o comprovativo.</p>
        <div className="contas-banco">
          {CONTAS_BANCARIAS.map(conta => <div className="conta-banco" key={conta.banco}>
            <b>{conta.banco}</b>
            <dl>
              <div><dt>Titular</dt><dd>{TITULAR}</dd></div>
              <div><dt>Conta</dt><dd>{conta.conta}</dd></div>
              <div><dt>NIB</dt><dd>{conta.nib}</dd></div>
              <div><dt>IBAN</dt><dd>{conta.iban}</dd></div>
              <div><dt>SWIFT</dt><dd>{conta.swift}</dd></div>
            </dl>
            <button type="button" className="copiar" onClick={() => copiar(conta.nib.replaceAll(' ', ''))}>Copiar NIB</button>
          </div>)}
        </div>
        <small className="dica">Contas de demonstração (fictícias) para o projecto académico.</small>
        <label className="upload-comprovativo">
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => { setComprovativo(e.target.files?.[0] || null); setErro('') }} />
          <span>{comprovativo ? `📎 ${comprovativo.name}` : 'Escolher o comprovativo (JPG, PNG ou PDF, até 3 MB)'}</span>
        </label>
        <button type="button" className="botao botao-laranja grande" disabled={enviando || !comprovativo} onClick={enviarComprovativo}>
          {enviando ? 'A enviar…' : 'Enviar comprovativo'}
        </button>
      </>}

      {tipo === 'numerario' && <>
        <p>Pague <b>{formatPrice(encomenda.valorTotal)}</b> em numerário no momento da entrega ou do levantamento. Tenha o valor certo, se possível.</p>
        <button type="button" className="botao botao-laranja grande" disabled={enviando} onClick={pagar}>
          {enviando ? 'A confirmar…' : 'Confirmar encomenda (pagamento na entrega)'}
        </button>
      </>}

      {!telemovel && !['cartao', 'banco', 'numerario'].includes(tipo) && (
        <button type="button" className="botao botao-laranja grande" disabled={enviando} onClick={pagar}>
          {enviando ? 'A confirmar…' : `Confirmar pagamento de ${formatPrice(encomenda.valorTotal)}`}
        </button>
      )}
    </>}
    {erro && !faseModal && <p className="erro" role="alert">{erro}</p>}
  </div>
}
