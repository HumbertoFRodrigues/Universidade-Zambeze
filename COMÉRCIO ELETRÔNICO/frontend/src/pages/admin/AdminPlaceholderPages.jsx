import { PagePlaceholder } from '../PagePlaceholder.jsx'

const criarPagina = title => function Pagina() {
  return <PagePlaceholder title={title} />
}

export const ServerErrorPage = criarPagina('Página de erro do servidor.')
export const ServiceUnavailablePage = criarPagina('Página de serviço indisponível.')
export const MaintenancePage = criarPagina('Página de manutenção.')
