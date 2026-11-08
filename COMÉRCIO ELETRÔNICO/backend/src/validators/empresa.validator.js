// Validação das contas de empresa (B2B). Funções puras que lançam { status, message }.

export const TIPOS_CLIENTE_EMPRESA = ['EMPRESA', 'REVENDEDOR']
export const ESTADOS_EMPRESA = ['PENDENTE', 'APROVADA', 'SUSPENSA']
export const MINIMO_PALAVRA_PASSE = 6

const erro = message => ({ status: 400, message })

function texto(valor, rotulo, max) {
  if (typeof valor !== 'string' || !valor.trim()) throw erro(`O campo ${rotulo} é obrigatório.`)
  const limpo = valor.trim()
  if (limpo.length > max) throw erro(`O campo ${rotulo} não pode exceder ${max} caracteres.`)
  return limpo
}

// NUIT moçambicano: 9 dígitos (espaços, pontos e traços são ignorados ao escrever).
export function normalizarNuit(valor) {
  const nuit = typeof valor === 'string' ? valor.replace(/[\s.-]/g, '') : String(valor ?? '')
  if (!/^\d{9}$/.test(nuit)) throw erro('O NUIT deve ter exactamente 9 dígitos.')
  return nuit
}

export function validarRegistoEmpresa(dados = {}) {
  if (dados.aceitePrivacidade !== true) throw erro('É obrigatório aceitar a Política de Privacidade.')
  if (!TIPOS_CLIENTE_EMPRESA.includes(dados.tipoCliente)) throw erro('Escolha o tipo de cliente: empresa ou revendedor.')
  if (typeof dados.palavraPasse !== 'string' || dados.palavraPasse.length < MINIMO_PALAVRA_PASSE) {
    throw erro(`A palavra-passe deve ter pelo menos ${MINIMO_PALAVRA_PASSE} caracteres.`)
  }
  const email = texto(dados.email, 'email', 254).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw erro('O email é inválido.')
  return {
    nome: texto(dados.nome, 'nome da empresa', 150),
    nuit: normalizarNuit(dados.nuit),
    email,
    telefone: texto(dados.telefone, 'telefone', 30),
    rua: texto(dados.rua, 'rua', 255),
    bairro: texto(dados.bairro, 'bairro', 100),
    cidade: texto(dados.cidade, 'cidade', 100),
    provincia: texto(dados.provincia, 'província', 100),
    tipoCliente: dados.tipoCliente,
    palavraPasse: dados.palavraPasse,
  }
}

// Decisão do administrador da loja. PENDENTE → APROVADA | SUSPENSA; APROVADA ↔ SUSPENSA.
// Suspender exige motivo (é enviado à empresa).
export function validarDecisaoEmpresa(dados = {}, estadoActual) {
  const { estado } = dados
  if (!['APROVADA', 'SUSPENSA'].includes(estado)) throw erro('O estado deve ser APROVADA ou SUSPENSA.')
  if (estado === estadoActual) throw { status: 409, message: `A empresa já está ${estado === 'APROVADA' ? 'aprovada' : 'suspensa'}.` }
  const motivo = typeof dados.motivo === 'string' ? dados.motivo.trim() : ''
  if (dados.motivo !== undefined && dados.motivo !== null && typeof dados.motivo !== 'string') throw erro('O motivo é inválido.')
  if (motivo.length > 500) throw erro('O motivo não pode exceder 500 caracteres.')
  if (estado === 'SUSPENSA' && !motivo) throw erro('Indique o motivo da suspensão.')
  return { estado, motivo: motivo || null }
}
