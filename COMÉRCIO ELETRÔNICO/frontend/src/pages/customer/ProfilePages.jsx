import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../lib/AuthContext.jsx'
import { ContaCabecalho, FuncionalidadeIndisponivel } from '../../components/conta/ContaLayout.jsx'
import { clienteApi, mensagemDeErro, MINIMO_PALAVRA_PASSE } from '../../services/cliente.js'
import { contaApi } from '../../services/api.js'

const PERFIS = { CLIENTE: 'Cliente', ADMINISTRADOR: 'Administrador' }

// Campos devolvidos por GET /auth/me.
export function DadosPerfil({ utilizador }) {
  return <dl className="conta-dados conta-dados--perfil">
    <div><dt>Nome</dt><dd>{utilizador.nome}</dd></div>
    <div><dt>Email</dt><dd>{utilizador.email}</dd></div>
    <div><dt>Telefone</dt><dd>{utilizador.telefone || '—'}</dd></div>
    <div><dt>Tipo de conta</dt><dd>{PERFIS[utilizador.perfil] || utilizador.perfil}</dd></div>
  </dl>
}

export function ProfilePage() {
  const { user } = useAuth()
  return <>
    <ContaCabecalho
      titulo="O meu perfil"
      descricao="Dados associados à sua conta EasyShop."
      accao={<Link className="botao botao-claro botao-pequeno" to="/conta/perfil/editar">Editar perfil</Link>}
    />
    <div className="conta-bloco">
      <h2>Dados pessoais</h2>
      <DadosPerfil utilizador={user} />
    </div>
    <div className="conta-bloco">
      <h2>Segurança</h2>
      <p className="suave">Pode definir uma nova palavra-passe com um código enviado para o seu email.</p>
      <div><Link className="botao botao-pequeno" to="/conta/palavra-passe">Alterar palavra-passe</Link></div>
    </div>
  </>
}

// PUT /conta/perfil: nome e telefone. O email identifica a conta e não é alterado aqui.
export function EditProfilePage() {
  const { user, actualizarUtilizador } = useAuth()
  const [campos, setCampos] = useState({ nome: user.nome || '', telefone: user.telefone || '' })
  const [envio, setEnvio] = useState({ aEnviar: false, mensagem: '', erro: '' })

  const submeter = async e => {
    e.preventDefault()
    if (!campos.nome.trim() || !campos.telefone.trim()) {
      return setEnvio({ aEnviar: false, mensagem: '', erro: 'Indique o nome e o telefone.' })
    }
    setEnvio({ aEnviar: true, mensagem: '', erro: '' })
    try {
      const resposta = await contaApi.actualizarPerfil({ nome: campos.nome.trim(), telefone: campos.telefone.trim() })
      actualizarUtilizador({ nome: resposta.utilizador.nome, telefone: resposta.utilizador.telefone })
      setEnvio({ aEnviar: false, mensagem: resposta.message, erro: '' })
    } catch (error) {
      setEnvio({ aEnviar: false, mensagem: '', erro: mensagemDeErro(error) })
    }
  }

  return <>
    <ContaCabecalho titulo="Editar perfil" voltar={{ to: '/conta/perfil', rotulo: 'Voltar ao perfil' }} />
    <form className="conta-bloco conta-form" onSubmit={submeter} noValidate>
      <div className="conta-campo">
        <label htmlFor="perfil-nome">Nome</label>
        <input id="perfil-nome" autoComplete="name" maxLength={150} value={campos.nome} onChange={e => setCampos({ ...campos, nome: e.target.value })} />
      </div>
      <div className="conta-campo">
        <label htmlFor="perfil-telefone">Telefone</label>
        <input id="perfil-telefone" autoComplete="tel" maxLength={30} value={campos.telefone} onChange={e => setCampos({ ...campos, telefone: e.target.value })} />
      </div>
      <div className="conta-campo">
        <label htmlFor="perfil-email">Email</label>
        <input id="perfil-email" value={user.email} disabled aria-describedby="perfil-email-nota" />
        <p id="perfil-email-nota" className="nota">O email identifica a conta e as encomendas e não pode ser alterado aqui.</p>
      </div>
      {envio.mensagem && <p className="sucesso" role="status">{envio.mensagem}</p>}
      {envio.erro && <p className="erro" role="alert">{envio.erro}</p>}
      <div className="conta-links">
        <button className="botao botao-laranja" type="submit" disabled={envio.aEnviar}>{envio.aEnviar ? 'A guardar…' : 'Guardar alterações'}</button>
        <Link className="botao botao-claro" to="/conta/perfil">Voltar ao perfil</Link>
      </div>
    </form>
  </>
}

export function ChangePasswordPage() {
  const { user } = useAuth()
  const [pedido, setPedido] = useState({ aEnviar: false, mensagem: '', erro: '' })
  const [campos, setCampos] = useState({ codigo: '', nova: '', confirmar: '' })
  const [erros, setErros] = useState({})
  const [envio, setEnvio] = useState({ aEnviar: false, mensagem: '', erro: '' })

  const pedirCodigo = async () => {
    setPedido({ aEnviar: true, mensagem: '', erro: '' })
    try {
      const resposta = await clienteApi.pedirCodigoPalavraPasse(user.email)
      setPedido({ aEnviar: false, mensagem: resposta.message, erro: '' })
    } catch (error) {
      setPedido({ aEnviar: false, mensagem: '', erro: mensagemDeErro(error) })
    }
  }

  const alterar = campo => e => setCampos(actual => ({ ...actual, [campo]: e.target.value }))

  const validar = () => {
    const novos = {}
    if (!campos.codigo.trim()) novos.codigo = 'Indique o código recebido por email.'
    if (campos.nova.length < MINIMO_PALAVRA_PASSE) novos.nova = `A nova palavra-passe deve ter pelo menos ${MINIMO_PALAVRA_PASSE} caracteres.`
    if (campos.confirmar !== campos.nova) novos.confirmar = 'As palavras-passe não são iguais.'
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  const submeter = async e => {
    e.preventDefault()
    setEnvio({ aEnviar: false, mensagem: '', erro: '' })
    if (!validar()) return
    setEnvio({ aEnviar: true, mensagem: '', erro: '' })
    try {
      const resposta = await clienteApi.reporPalavraPasse(campos.codigo.trim(), campos.nova)
      setCampos({ codigo: '', nova: '', confirmar: '' })
      setEnvio({ aEnviar: false, mensagem: resposta.message, erro: '' })
    } catch (error) {
      setEnvio({ aEnviar: false, mensagem: '', erro: mensagemDeErro(error) })
    }
  }

  return <>
    <ContaCabecalho
      titulo="Alterar palavra-passe"
      descricao="Por segurança, a alteração é confirmada com um código enviado para o email da conta."
      voltar={{ to: '/conta/perfil', rotulo: 'Voltar ao perfil' }}
    />

    <div className="conta-bloco">
      <h2>1. Receber o código</h2>
      <p className="suave">Vamos enviar um código de confirmação para <b>{user.email}</b>. O código é válido durante 1 hora.</p>
      {pedido.mensagem && <p className="sucesso" role="status">{pedido.mensagem}</p>}
      {pedido.erro && <p className="erro" role="alert">{pedido.erro}</p>}
      <div>
        <button type="button" className="botao botao-claro" onClick={pedirCodigo} disabled={pedido.aEnviar}>
          {pedido.aEnviar ? 'A enviar…' : pedido.mensagem ? 'Enviar novo código' : 'Enviar código'}
        </button>
      </div>
    </div>

    <form className="conta-bloco" onSubmit={submeter} noValidate>
      <h2>2. Definir a nova palavra-passe</h2>
      <div className="conta-campo">
        <label htmlFor="senha-codigo">Código recebido por email</label>
        <input id="senha-codigo" name="codigo" autoComplete="one-time-code" value={campos.codigo} onChange={alterar('codigo')} aria-invalid={erros.codigo ? 'true' : undefined} aria-describedby={erros.codigo ? 'senha-codigo-erro' : undefined} />
        {erros.codigo && <p id="senha-codigo-erro" className="erro">{erros.codigo}</p>}
      </div>
      <div className="duas">
        <div className="conta-campo">
          <label htmlFor="senha-nova">Nova palavra-passe</label>
          <input id="senha-nova" name="nova" type="password" autoComplete="new-password" value={campos.nova} onChange={alterar('nova')} aria-invalid={erros.nova ? 'true' : undefined} aria-describedby="senha-nova-ajuda" />
          <p id="senha-nova-ajuda" className={erros.nova ? 'erro' : 'nota'}>{erros.nova || `Mínimo de ${MINIMO_PALAVRA_PASSE} caracteres.`}</p>
        </div>
        <div className="conta-campo">
          <label htmlFor="senha-confirmar">Repetir nova palavra-passe</label>
          <input id="senha-confirmar" name="confirmar" type="password" autoComplete="new-password" value={campos.confirmar} onChange={alterar('confirmar')} aria-invalid={erros.confirmar ? 'true' : undefined} aria-describedby={erros.confirmar ? 'senha-confirmar-erro' : undefined} />
          {erros.confirmar && <p id="senha-confirmar-erro" className="erro">{erros.confirmar}</p>}
        </div>
      </div>
      {envio.mensagem && <p className="sucesso" role="status">{envio.mensagem}</p>}
      {envio.erro && <p className="erro" role="alert">{envio.erro}</p>}
      <div>
        <button className="botao botao-laranja" type="submit" disabled={envio.aEnviar}>{envio.aEnviar ? 'A guardar…' : 'Guardar nova palavra-passe'}</button>
      </div>
    </form>
  </>
}

export function PreferencesPage() {
  return <>
    <ContaCabecalho titulo="Preferências" />
    <FuncionalidadeIndisponivel
      titulo="Ainda não há preferências configuráveis"
      accao={<Link className="botao botao-claro botao-pequeno" to="/conta">Voltar à conta</Link>}
    >
      A EasyShop ainda não guarda preferências de conta, como notificações ou comunicações. Quando estiverem
      disponíveis, poderá geri-las nesta página.
    </FuncionalidadeIndisponivel>
  </>
}
