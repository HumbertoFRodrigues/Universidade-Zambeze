import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import AuthLayout from '../components/AuthLayout.jsx'
import { useAuth } from '../lib/AuthContext.jsx'
import { authApi } from '../services/api.js'
import '../styles/conta.css'

const ROTAS_SEM_RETORNO = new Set([
  '/entrar',
  '/login',
  '/registar',
  '/register',
  '/recuperar',
  '/recuperar-palavra-passe',
  '/redefinir-palavra-passe',
])

function caminhoDeOrigem(origem) {
  const caminho = typeof origem === 'string'
    ? origem
    : origem && typeof origem === 'object'
      ? `${origem.pathname || ''}${origem.search || ''}${origem.hash || ''}`
      : ''
  if (!caminho.startsWith('/') || caminho.startsWith('//') || caminho.includes('\\')) return null

  try {
    const url = new URL(caminho, window.location.origin)
    if (url.origin !== window.location.origin || ROTAS_SEM_RETORNO.has(url.pathname) || url.pathname.startsWith('/conta')) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}

const VISTA = {
  login: {
    title: 'Bem-vindo de volta',
    subtitle: 'Entre na sua conta EasyShop.',
  },
  register: {
    title: 'Criar conta',
    subtitle: 'Preencha os seus dados para começar.',
  },
  recover: {
    title: 'Recuperar acesso',
    subtitle: 'Indique o email associado à sua conta.',
  },
}

function forca(senha) {
  return [
    senha.length >= 8,
    /[a-z]/.test(senha) && /[A-Z]/.test(senha),
    /\d/.test(senha),
    /[^A-Za-z0-9]/.test(senha),
  ].filter(Boolean).length
}

function CampoPalavraPasse({ id, name, autoComplete, required = false, minLength, value, onChange }) {
  const [visivel, setVisivel] = useState(false)

  return <div className="auth-password-field">
    <input
      id={id}
      name={name}
      type={visivel ? 'text' : 'password'}
      required={required}
      minLength={minLength}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
    />
    <button
      className="auth-password-field__toggle"
      type="button"
      aria-label={visivel ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
      aria-controls={id}
      onClick={() => setVisivel(actual => !actual)}
    >
      {visivel ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
    </button>
  </div>
}

export function AuthPage({ mode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [senha, setSenha] = useState('')
  const [aEnviar, setAEnviar] = useState(false)
  const [tipoConta, setTipoConta] = useState('particular')
  const { title, subtitle } = VISTA[mode]
  const empresa = mode === 'register' && tipoConta === 'empresa'

  const concluirLogin = utilizador => {
    const origem = caminhoDeOrigem(location.state?.from)
    const destino = origem || (utilizador.perfil === 'ADMINISTRADOR' ? '/admin' : utilizador.perfil === 'EMPRESA' ? '/conta/empresa' : '/')
    navigate(destino, { replace: true, state: { loginSuccess: true } })
  }

  const aoEntrar = async e => {
    e.preventDefault()
    setErro('')
    setAEnviar(true)
    const dados = new FormData(e.currentTarget)
    try {
      const utilizador = await login(dados.get('email'), dados.get('senha'))
      concluirLogin(utilizador)
    } catch (error) {
      setErro(error.message)
    } finally {
      setAEnviar(false)
    }
  }

  const aoRegistar = async e => {
    e.preventDefault()
    setErro('')
    const dados = new FormData(e.currentTarget)
    if (dados.get('senha') !== dados.get('confirmar')) {
      setErro('As palavras-passe não são iguais.')
      return
    }
    if (forca(dados.get('senha')) < 2 || dados.get('senha').length < 8) {
      setErro('Use pelo menos 8 caracteres, com letras e números.')
      return
    }
    if (empresa && !/^\d{9}$/.test(String(dados.get('nuit') || '').replace(/[\s.-]/g, ''))) {
      setErro('O NUIT deve ter exactamente 9 dígitos.')
      return
    }
    setAEnviar(true)
    try {
      // Conta de empresa: fica pendente até a loja aprovar; não inicia sessão automaticamente.
      if (empresa) {
        const resposta = await authApi.registarEmpresa({
          nome: dados.get('nome'),
          nuit: dados.get('nuit'),
          email: dados.get('email'),
          telefone: dados.get('telefone'),
          tipoCliente: dados.get('tipoCliente'),
          rua: dados.get('rua'),
          bairro: dados.get('bairro'),
          cidade: dados.get('cidade'),
          provincia: dados.get('provincia'),
          palavraPasse: dados.get('senha'),
          aceitePrivacidade: true,
        })
        e.target.reset()
        setSenha('')
        setAviso(resposta.message)
        return
      }
      await authApi.registar({
        nome: dados.get('nome'),
        email: dados.get('email'),
        telefone: dados.get('telefone'),
        senha: dados.get('senha'),
        aceitePrivacidade: true,
      })
      const utilizador = await login(dados.get('email'), dados.get('senha'))
      concluirLogin(utilizador)
    } catch (error) {
      setErro(error.message)
    } finally {
      setAEnviar(false)
    }
  }

  const aoRecuperar = async e => {
    e.preventDefault()
    setErro('')
    setAEnviar(true)
    try {
      const dados = new FormData(e.currentTarget)
      const resultado = await authApi.esquecer(dados.get('email'))
      setAviso(resultado.message || 'Se o endereço estiver registado, receberá instruções para recuperar o acesso.')
    } catch (error) {
      setErro(error.message)
    } finally {
      setAEnviar(false)
    }
  }

  const footer = mode === 'login'
    ? <>Ainda não tem conta? <Link className="auth-page__link" to="/register">Criar conta</Link></>
    : mode === 'register'
      ? <>Já tem conta? <Link className="auth-page__link" to="/login">Entrar</Link></>
      : <Link className="auth-page__link" to="/login">← Voltar ao login</Link>

  return <AuthLayout title={title} subtitle={subtitle} footer={footer}>
    {mode === 'login' && <form className="campos" onSubmit={aoEntrar}>
      <label htmlFor="login-email">Email</label>
      <input id="login-email" name="email" type="email" required autoComplete="email" />
      <label htmlFor="login-password">Palavra-passe</label>
      <CampoPalavraPasse id="login-password" name="senha" required autoComplete="current-password" />
      {erro && <p className="erro" role="alert">{erro}</p>}
      <button className="botao botao-laranja grande" type="submit" disabled={aEnviar}>{aEnviar ? 'A entrar…' : 'Entrar'}</button>
      <Link className="auth-page__link auth-page__forgot" to="/recuperar">Esqueci-me da palavra-passe</Link>
    </form>}

    {mode === 'register' && <form className="campos" onSubmit={aoRegistar}>
      <label htmlFor="register-type">Tipo de conta</label>
      <select id="register-type" name="tipo" value={tipoConta} onChange={e => { setTipoConta(e.target.value); setErro(''); setAviso('') }}>
        <option value="particular">Particular</option>
        <option value="empresa">Empresa</option>
      </select>
      {empresa && <p className="nota">As contas de empresa precisam de aprovação da loja e compram através de cotações. Receberá um email quando a empresa for aprovada.</p>}
      <label htmlFor="register-name">{empresa ? 'Nome da empresa' : 'Nome completo'}</label>
      <input id="register-name" name="nome" required maxLength={150} autoComplete={empresa ? 'organization' : 'name'} />
      <div className="duas">
        <div>
          <label htmlFor="register-email">Email</label>
          <input id="register-email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label htmlFor="register-phone">Telefone</label>
          <input id="register-phone" name="telefone" type="tel" required autoComplete="tel" />
        </div>
      </div>
      {empresa && <>
        <div className="duas">
          <div>
            <label htmlFor="register-nuit">NUIT</label>
            <input id="register-nuit" name="nuit" required inputMode="numeric" maxLength={11} placeholder="9 dígitos" />
          </div>
          <div>
            <label htmlFor="register-tipo-cliente">Tipo de cliente</label>
            <select id="register-tipo-cliente" name="tipoCliente" defaultValue="EMPRESA">
              <option value="EMPRESA">Empresa</option>
              <option value="REVENDEDOR">Revendedor</option>
            </select>
          </div>
        </div>
        <label htmlFor="register-rua">Endereço de facturação (rua e número)</label>
        <input id="register-rua" name="rua" required maxLength={255} autoComplete="address-line1" />
        <div className="duas">
          <div>
            <label htmlFor="register-bairro">Bairro</label>
            <input id="register-bairro" name="bairro" required maxLength={100} />
          </div>
          <div>
            <label htmlFor="register-cidade">Cidade</label>
            <input id="register-cidade" name="cidade" required maxLength={100} autoComplete="address-level2" />
          </div>
        </div>
        <label htmlFor="register-provincia">Província</label>
        <input id="register-provincia" name="provincia" required maxLength={100} autoComplete="address-level1" />
      </>}
      <label htmlFor="register-password">Palavra-passe (mínimo 8 caracteres)</label>
      <CampoPalavraPasse
        id="register-password"
        name="senha"
        required
        minLength={8}
        autoComplete="new-password"
        value={senha}
        onChange={e => setSenha(e.target.value)}
      />
      <div className={`forca forca-${forca(senha)}`} aria-label={`Força da palavra-passe: ${forca(senha)} de 4`}>
        <i /><i /><i /><i />
      </div>
      <label htmlFor="register-confirm">Repetir palavra-passe</label>
      <CampoPalavraPasse id="register-confirm" name="confirmar" required autoComplete="new-password" />
      {erro && <p className="erro" role="alert">{erro}</p>}
      {aviso && <p className="sucesso" role="status">{aviso}</p>}
      <button className="botao botao-laranja grande" type="submit" disabled={aEnviar}>{aEnviar ? 'A criar conta…' : empresa ? 'Pedir registo da empresa' : 'Criar conta'}</button>
      <p className="nota">Ao criar a conta, aceita os termos e condições e a política de privacidade.</p>
    </form>}

    {mode === 'recover' && <form className="campos" onSubmit={aoRecuperar}>
      <label htmlFor="recover-email">Email</label>
      <input id="recover-email" name="email" type="email" required autoComplete="email" />
      {erro && <p className="erro" role="alert">{erro}</p>}
      {aviso && <p className="sucesso" role="status">{aviso}</p>}
      <button className="botao botao-laranja grande" type="submit" disabled={aEnviar}>{aEnviar ? 'A enviar…' : 'Recuperar acesso'}</button>
    </form>}
  </AuthLayout>
}
