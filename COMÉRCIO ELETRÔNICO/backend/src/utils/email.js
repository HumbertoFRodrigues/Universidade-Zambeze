import { obterTransporter } from '../services/auth.service.js'

// Envia um email sem prender o pedido: desiste ao fim de 10 s. Devolve true/false (nunca lança),
// porque o email é uma notificação e a operação principal já foi gravada.
export async function enviarEmail({ para, assunto, texto }, limiteMs = 10000) {
  let temporizador
  const limite = new Promise((_, rejeitar) => {
    temporizador = setTimeout(() => rejeitar(new Error('Tempo de envio do email esgotado.')), limiteMs)
  })
  try {
    await Promise.race([
      obterTransporter().sendMail({ from: '"EasyShop" <suporte@easyshop.com>', to: para, subject: assunto, text: texto }),
      limite,
    ])
    return true
  } catch (error) {
    console.error(`[EMAIL] Não foi possível enviar "${assunto}" para ${para}:`, error.message)
    return false
  } finally {
    clearTimeout(temporizador)
  }
}
