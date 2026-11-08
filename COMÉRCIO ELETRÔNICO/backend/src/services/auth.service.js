import bcrypt from 'bcrypt'
import { randomBytes } from 'node:crypto'
import nodemailer from 'nodemailer'
import { prisma } from '../lib/prisma.js'

export function obterTransporter() {
  const user = process.env.SMTP_USER?.trim() || '1244c79653c049'
  const pass = process.env.SMTP_PASS?.trim() || 'afcc0980160976'

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 2525,
    auth: {
      user: user,
      pass: pass,
    },
  })
}

export async function solicitarRecuperacao(email) {
  if (!email) {
    throw { status: 400, message: 'O email é obrigatório.' }
  }

  const emailFormatado = email.trim().toLowerCase()
  const utilizador = await prisma.utilizador.findUnique({
    where: { email: emailFormatado },
  })

  if (utilizador && utilizador.activo) {
    const tokenPlano = randomBytes(32).toString('hex')
    const hashToken = await bcrypt.hash(tokenPlano, 10)
    const tokenExpiracao = new Date(Date.now() + 3600 * 1000) // Expira em 1 hora

    await prisma.tokenRecuperacao.create({
      data: {
        utilizadorId: utilizador.id,
        hashToken: hashToken,
        expiraEm: tokenExpiracao,
      },
    })

    try {
      const transporter = obterTransporter()
      await transporter.sendMail({
        from: '"EasyShop" <suporte@easyshop.com>',
        to: emailFormatado,
        subject: 'Recuperação de Palavra-Passe - EasyShop',
        text: `Olá,\n\nRecebemos um pedido para recuperar a palavra-passe da sua conta. O seu token de recuperação é:\n\n${tokenPlano}\n\nEste token expira em 1 hora.\n\nSe não solicitou esta alteração, por favor ignore este email.`,
      })
      console.log(`[AUTH] Email de recuperação enviado com sucesso para ${emailFormatado}`)
      console.log(`[AUTH] Token gerado para testes: ${tokenPlano}`)
    } catch (error) {
      console.error('[AUTH] Erro detalhado ao enviar email via Mailtrap:', error)
    }
  } else if (utilizador && !utilizador.activo) {
    console.warn(`[AUTH] Pedido de recuperação recusado: a conta ${emailFormatado} está inactiva na base de dados.`)
  }

  return {
    message: 'Se o email estiver registado, receberá as instruções de recuperação em breve.',
  }
}

export async function reporPalavraPasse(token, novaPalavraPasse) {
  if (!token || !novaPalavraPasse) {
    throw { status: 400, message: 'O token e a nova palavra-passe são obrigatórios.' }
  }

  if (novaPalavraPasse.length < 6) {
    throw { status: 400, message: 'A nova palavra-passe deve ter pelo menos 6 caracteres.' }
  }

  const tokensAtivos = await prisma.tokenRecuperacao.findMany({
    where: {
      expiraEm: { gt: new Date() },
    },
    include: { utilizador: true },
  })

  let registoToken = null
  for (const item of tokensAtivos) {
    const corresponde = await bcrypt.compare(token, item.hashToken)
    if (corresponde) {
      registoToken = item
      break
    }
  }

  if (!registoToken || !registoToken.utilizador || !registoToken.utilizador.activo) {
    throw { status: 400, message: 'Token de recuperação inválido ou expirado.' }
  }

  const palavraPasseHash = await bcrypt.hash(novaPalavraPasse, 10)

  await prisma.$transaction(async (transaction) => {
    await transaction.utilizador.update({
      where: { id: registoToken.utilizadorId },
      data: {
        hashPalavraPasse: palavraPasseHash,
        actualizadoEm: new Date(),
      },
    })

    await transaction.tokenRecuperacao.delete({
      where: { id: registoToken.id },
    })

    await transaction.registoAuditoria.create({
      data: {
        utilizadorAutorId: registoToken.utilizadorId,
        accao: 'REPOR_PALAVRA_PASSE',
        tipoEntidade: 'utilizador',
        idEntidade: String(registoToken.utilizadorId),
        detalhes: { email: registoToken.utilizador.email },
      },
    })
  })

  return { message: 'Palavra-passe alterada com sucesso.' }
}