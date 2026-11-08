// Contas de utilizador, só para demonstração: ficam guardadas neste computador (localStorage).
// No sistema real, o backend guarda os dados e a palavra-passe cifrada.
const CHAVE_UTILIZADORES = 'easyshop-utilizadores'
const CHAVE_SESSAO = 'easyshop-sessao'

function ler(chave, vazio) {
  try { return JSON.parse(localStorage.getItem(chave)) ?? vazio } catch { return vazio }
}

function gravar(chave, valor) {
  try { localStorage.setItem(chave, JSON.stringify(valor)) } catch { /* sem armazenamento disponível */ }
}

export function utilizadorAtual() {
  const email = ler(CHAVE_SESSAO, null)
  return email ? ler(CHAVE_UTILIZADORES, []).find(u => u.email === email) || null : null
}

// Cria a conta e entra logo. Devolve { erro } se o email já existir.
export function criarConta(dados) {
  const lista = ler(CHAVE_UTILIZADORES, [])
  const email = dados.email.trim().toLowerCase()
  if (lista.some(u => u.email === email)) return { erro: 'Já existe uma conta com este email. Tente entrar.' }
  const novo = { ...dados, email, moradas: [] }
  gravar(CHAVE_UTILIZADORES, [...lista, novo])
  gravar(CHAVE_SESSAO, email)
  return { utilizador: novo }
}

export function entrar(email, senha) {
  const u = ler(CHAVE_UTILIZADORES, []).find(x => x.email === email.trim().toLowerCase())
  if (!u || u.senha !== senha) return { erro: 'Email ou palavra-passe incorretos.' }
  gravar(CHAVE_SESSAO, u.email)
  return { utilizador: u }
}

export function sair() {
  gravar(CHAVE_SESSAO, null)
}

// Guarda a lista de moradas do utilizador que está dentro
export function guardarMoradas(moradas) {
  const email = ler(CHAVE_SESSAO, null)
  gravar(CHAVE_UTILIZADORES, ler(CHAVE_UTILIZADORES, []).map(u => (u.email === email ? { ...u, moradas } : u)))
  return utilizadorAtual()
}