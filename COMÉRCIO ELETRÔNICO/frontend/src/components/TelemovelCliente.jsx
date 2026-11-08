import { useEffect, useState } from 'react'
import { formatPrice } from '../services/formatar.js'
import '../styles/pagamento.css'

// Telemóvel do cliente (simulação): chega o pedido e o PIN é digitado aqui, nunca no site.
// O PIN 0000 simula um pagamento recusado. Qualquer outro PIN de 4 dígitos é aceite.
export function TelemovelCliente({ metodo, valor, ativo, aoPagar, aoFalhar }) {
    const [fase, setFase] = useState('bloqueado')
    const [pin, setPin] = useState('')

  // Quando o pedido é enviado, a notificação chega ao telemóvel passado 1,6 segundos
    useEffect(() => {
    if (!ativo) return
    const espera = setTimeout(() => setFase('pedido'), 1600)
    return () => clearTimeout(espera)
    }, [ativo])

    const digitar = n => {
    const novo = (pin + n).slice(0, 4)
    setPin(novo)
    if (novo.length < 4) return
    setFase('processando')
    setTimeout(() => {
        if (novo === '0000') {
        setFase('erro')
        setTimeout(aoFalhar, 1400)
        } else {
        setFase('ok')
        setTimeout(aoPagar, 900)
        }
    }, 1200)
    }

    const nome = metodo === 'mpesa' ? 'M-Pesa' : 'e-Mola'

    return <div className="telemovel">
    <div className="ecra">
        {fase === 'bloqueado' && <div className="bloqueio"><b>09:41</b><small>{ativo ? 'À espera de um pedido…' : 'Telemóvel do cliente'}</small></div>}
        {fase === 'pedido' && <div className="bloqueio"><b>09:41</b>
        <button type="button" className="notificacao" onClick={() => setFase('pin')}>
            <i className={'logo-' + metodo}>{nome.slice(0, 2)}</i>
            <span><b>{nome}</b><small>Pagar {formatPrice(valor)} à EasyShop? Toque para confirmar.</small></span>
        </button></div>}
        {(fase === 'pin' || fase === 'processando') && <div className="pin">
        <b>Introduza o seu PIN</b>
        <div className="pontos-pin">{[0, 1, 2, 3].map(i => <span key={i} className={i < pin.length ? 'ativo' : ''} />)}</div>
        {fase === 'processando' ? <p>A processar…</p> : <div className="teclado">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <button key={n} type="button" onClick={() => digitar(n)}>{n}</button>)}
            <span /><button type="button" onClick={() => digitar(0)}>0</button>
            <button type="button" onClick={() => setPin(pin.slice(0, -1))} aria-label="Apagar">⌫</button>
        </div>}
        </div>}
        {fase === 'ok' && <div className="pin"><i className="certo">✓</i><b>Pagamento enviado</b></div>}
        {fase === 'erro' && <div className="pin"><i className="certo falha">×</i><b>Pagamento recusado</b><small>PIN incorreto</small></div>}
    </div>
    <small className="legenda">Telemóvel do cliente (simulação). O PIN 0000 simula uma falha.</small>
    </div>
}