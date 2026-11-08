import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext.jsx'
import { validarCodigoEncomenda } from '../../services/cliente.js'

// Sem listagem de encomendas na API, o cliente abre uma encomenda pelo código.
export function ConsultarEncomenda({ titulo = 'Consultar uma encomenda' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')

  const consultar = e => {
    e.preventDefault()
    const mensagem = validarCodigoEncomenda(codigo)
    setErro(mensagem)
    if (!mensagem) navigate(`/conta/encomendas/${encodeURIComponent(codigo.trim())}`)
  }

  return <form className="conta-bloco" onSubmit={consultar} noValidate>
    <h2>{titulo}</h2>
    <p className="suave">Indique o código da encomenda feita com o email {user.email}.</p>
    <div className="conta-form-linha">
      <div className="conta-campo">
        <label htmlFor="conta-codigo">Código da encomenda</label>
        <input id="conta-codigo" name="codigo" placeholder="Por exemplo, ENC-1A2B3C4D5E6F7A8B" value={codigo} onChange={e => setCodigo(e.target.value)} aria-invalid={erro ? 'true' : undefined} aria-describedby={erro ? 'conta-codigo-erro' : undefined} />
      </div>
      <button className="botao botao-laranja" type="submit">Consultar</button>
    </div>
    {erro && <p id="conta-codigo-erro" className="erro" role="alert">{erro}</p>}
  </form>
}
