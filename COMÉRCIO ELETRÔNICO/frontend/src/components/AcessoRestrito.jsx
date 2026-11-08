import { useEffect, useState } from 'react'
import '../styles/acesso-restrito.css'

const CHAVE = 'easyshop-acesso-restrito-ate'

function lerFim() {
  try { return Number(sessionStorage.getItem(CHAVE)) || 0 } catch { return 0 }
}

// Ecrã que cobre todo o site enquanto o IP está bloqueado (3 inícios de sessão falhados).
// Sobrevive a recarregar a página durante o bloqueio.
export function AcessoRestrito() {
  const [fim, setFim] = useState(lerFim)
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    const aoBloquear = evento => {
      const novoFim = Date.now() + (evento.detail?.segundos || 50) * 1000
      try { sessionStorage.setItem(CHAVE, String(novoFim)) } catch { /* armazenamento bloqueado */ }
      setFim(novoFim)
      setAgora(Date.now())
    }
    window.addEventListener('acesso:restrito', aoBloquear)
    return () => window.removeEventListener('acesso:restrito', aoBloquear)
  }, [])

  const restante = Math.max(0, Math.ceil((fim - agora) / 1000))

  useEffect(() => {
    if (!restante) return undefined
    const intervalo = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(intervalo)
  }, [restante])

  useEffect(() => {
    document.documentElement.classList.toggle('acesso-restrito-activo', restante > 0)
    if (!restante) { try { sessionStorage.removeItem(CHAVE) } catch { /* armazenamento bloqueado */ } }
  }, [restante])

  if (!restante) return null
  return <div className="acesso-restrito" role="alertdialog" aria-modal="true" aria-labelledby="acesso-restrito-titulo" aria-describedby="acesso-restrito-texto">
    <div className="acesso-restrito__caixa">
      <div className="acesso-restrito__icone" aria-hidden="true">🔒</div>
      <h1 id="acesso-restrito-titulo">Acesso restrito</h1>
      <p id="acesso-restrito-texto">Foram feitas várias tentativas de início de sessão com dados errados a partir deste dispositivo. Por segurança, o acesso à loja foi bloqueado temporariamente.</p>
      <div className="acesso-restrito__contagem" aria-live="polite"><b>{restante}</b><span>segundos</span></div>
      <small>Depois deste tempo pode tentar novamente. Se esqueceu a palavra-passe, use "Esqueci-me da palavra-passe".</small>
    </div>
  </div>
}
