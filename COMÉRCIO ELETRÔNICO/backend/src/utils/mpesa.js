import crypto from 'node:crypto'

export function gerarTokenMpesa() {
  const apiKey = process.env.MPESA_API_KEY
  const publicKeyBase64 = process.env.MPESA_PUBLIC_KEY

  if (!apiKey || !publicKeyBase64) {
    throw new Error('Credenciais do M-Pesa em falta no ficheiro .env')
  }

  // Formatar a chave pública de Base64 para o formato PEM exigido pelo Node.js
  const pemKey = `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`

  // Cifragem RSA da API Key usando a Public Key (equivalente ao código Java da documentação)
  const buffer = Buffer.from(apiKey, 'utf-8')
  const encrypted = crypto.publicEncrypt(
    {
      key: pemKey,
      padding: crypto.constants.RSA_PKCS1_PADDING
    },
    buffer
  )

  return encrypted.toString('base64')
}