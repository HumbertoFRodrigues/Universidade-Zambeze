import { PagePlaceholder } from '../PagePlaceholder.jsx'

const criarPagina = title => function Pagina() {
  return <PagePlaceholder title={title} />
}

export const ContactVerificationPage = criarPagina('Página de verificação de contacto.')
export const ContactVerificationResultPage = criarPagina('Resultado da verificação de contacto.')
export const SessionExpiredPage = criarPagina('Página de sessão expirada.')
export const AccessDeniedPage = criarPagina('Página de acesso negado.')
