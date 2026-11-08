import { constants, publicEncrypt } from 'node:crypto'
import https from 'node:https'

// Cliente M-Pesa (Vodacom Moçambique, API C2B single stage).
// Adaptado do MpesaService do payment-api (Laravel) usado no Portal do Mundo.

const CODIGOS_ERRO = {
  'INS-2': 'Credenciais M-Pesa inválidas.',
  'INS-5': 'Pagamento cancelado. O PIN não foi confirmado.',
  'INS-6': 'Transacção falhada. Tente novamente.',
  'INS-9': 'Pedido expirado (timeout). Tente novamente.',
  'INS-10': 'Referência duplicada. Tente novamente.',
  'INS-13': 'Código de serviço M-Pesa inválido.',
  'INS-15': 'Valor inválido para pagamento M-Pesa.',
  'INS-16': 'Serviço M-Pesa temporariamente sobrecarregado. Tente daqui a pouco.',
  'INS-17': 'Referência de transacção inválida. Tente novamente.',
  'INS-19': 'Referência da encomenda inválida para a M-Pesa.',
  'INS-20': 'Pedido M-Pesa incompleto. Tente novamente.',
  'INS-21': 'Dados do pagamento rejeitados pela M-Pesa.',
  'INS-995': 'A conta M-Pesa deste número tem restrições.',
  'INS-996': 'A conta M-Pesa deste número não está activa.',
  'INS-2001': 'Erro de autenticação na M-Pesa.',
  'INS-2006': 'Saldo insuficiente na carteira M-Pesa.',
  'INS-2051': 'Número de telemóvel inválido.',
}

export function configuracaoMpesa() {
  return {
    apiKey: process.env.MPESA_API_KEY || '',
    publicKey: process.env.MPESA_PUBLIC_KEY || '',
    codigoProvedor: process.env.MPESA_SERVICE_PROVIDER_CODE || '171717',
    sandbox: process.env.MPESA_SANDBOX !== 'false',
  }
}

export function mpesaConfigurado() {
  const { apiKey, publicKey } = configuracaoMpesa()
  return Boolean(apiKey && publicKey)
}

export function mensagemErroMpesa(codigo) {
  return CODIGOS_ERRO[codigo] || `Erro M-Pesa (${codigo}). Tente novamente.`
}

// "84 123 4567" / "+258841234567" -> "258841234567"; null se não for Vodacom (84/85).
export function normalizarTelefoneMpesa(telefone) {
  let numero = String(telefone || '').replace(/\D/g, '')
  if (numero.length === 9) numero = `258${numero}`
  return /^258(84|85)\d{7}$/.test(numero) ? numero : null
}

// O token Bearer é a API Key cifrada com a chave pública RSA (PKCS#1 v1.5).
function gerarBearer({ apiKey, publicKey }) {
  const limpa = publicKey.replace(/\s+/g, '')
  const pem = `-----BEGIN PUBLIC KEY-----\n${limpa.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----\n`
  return publicEncrypt({ key: pem, padding: constants.RSA_PKCS1_PADDING }, Buffer.from(apiKey)).toString('base64')
}

// Envia o pedido de pagamento; a API só responde depois de o cliente
// confirmar (ou recusar) o PIN no telemóvel — até cerca de 2,5 minutos.
export function c2bSingleStage({ telefone, valor, referenciaTransaccao, referenciaTerceiro }) {
  const config = configuracaoMpesa()
  const corpo = JSON.stringify({
    input_TransactionReference: referenciaTransaccao,
    input_CustomerMSISDN: telefone,
    input_Amount: String(valor),
    input_ThirdPartyReference: referenciaTerceiro,
    input_ServiceProviderCode: config.codigoProvedor,
  })

  return new Promise((resolve, reject) => {
    const pedido = https.request({
      host: config.sandbox ? 'api.sandbox.vm.co.mz' : 'api.vm.co.mz',
      port: 18352,
      path: '/ipg/v1x/c2bPayment/singleStage/',
      method: 'POST',
      timeout: 160000,
      // O sandbox da Vodacom usa um certificado que não valida; produção valida sempre.
      rejectUnauthorized: !config.sandbox,
      headers: {
        Authorization: `Bearer ${gerarBearer(config)}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(corpo),
        Origin: 'developer.mpesa.vm.co.mz',
      },
    }, resposta => {
      let dados = ''
      resposta.on('data', parte => { dados += parte })
      resposta.on('end', () => {
        let json = {}
        try { json = JSON.parse(dados) } catch { /* resposta sem JSON */ }
        resolve({
          httpCode: resposta.statusCode,
          codigo: json.output_ResponseCode || null,
          transaccaoId: json.output_TransactionID || null,
          descricao: json.output_ResponseDesc || null,
        })
      })
    })
    pedido.on('timeout', () => pedido.destroy(new Error('Tempo de espera da M-Pesa esgotado.')))
    pedido.on('error', reject)
    pedido.end(corpo)
  })
}
