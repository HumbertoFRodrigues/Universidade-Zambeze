import { Link } from 'react-router-dom'
import { ContaCabecalho, FuncionalidadeIndisponivel } from '../../components/conta/ContaLayout.jsx'
import { EstadoConta, ResultadoConta } from '../../components/conta/ResultadoConta.jsx'
import { useDadosConta } from '../../hooks/useDadosConta.js'
import { useAuth } from '../../lib/AuthContext.jsx'
import { empresaApi } from '../../services/api.js'
import { dataLegivel } from '../../lib/format.js'

export const ESTADOS_EMPRESA = { PENDENTE: 'A aguardar aprovação', APROVADA: 'Aprovada', SUSPENSA: 'Suspensa' }
export const TIPOS_CLIENTE = { EMPRESA: 'Empresa', REVENDEDOR: 'Revendedor' }

// "A minha empresa" (GET /empresa): dados e estado da aprovação pela loja.
export function CompanyPage() {
  const { user } = useAuth()
  const contaEmpresa = user?.perfil === 'EMPRESA'
  const { data, error, loading, recarregar } = useDadosConta(
    opcoes => (contaEmpresa ? empresaApi.minha(opcoes) : Promise.resolve(null)), `empresa-${user?.id}`,
  )

  if (!contaEmpresa) {
    return <>
      <ContaCabecalho titulo="A minha empresa" />
      <FuncionalidadeIndisponivel titulo="Esta conta não é de empresa" accao={<Link className="botao botao-claro botao-pequeno" to="/conta">Voltar à conta</Link>}>
        Para comprar como empresa, crie uma conta do tipo empresa. O pedido é analisado pela loja.
      </FuncionalidadeIndisponivel>
    </>
  }

  return <>
    <ContaCabecalho titulo="A minha empresa" descricao="Dados da empresa e estado da aprovação pela loja." />
    <ResultadoConta loading={loading} error={error} recarregar={recarregar} mensagem="A carregar a empresa…">
      {data && <DadosEmpresa empresa={data.empresa} />}
    </ResultadoConta>
  </>
}

function DadosEmpresa({ empresa }) {
  return <>
    {empresa.estado === 'PENDENTE' && <FuncionalidadeIndisponivel titulo="Pedido em análise">
      A loja ainda está a analisar o registo da empresa. Vai receber um email em {empresa.email} quando for aprovada;
      a partir daí pode pedir cotações.
    </FuncionalidadeIndisponivel>}
    {empresa.estado === 'SUSPENSA' && <FuncionalidadeIndisponivel titulo="Conta de empresa suspensa">
      {empresa.motivoEstado ? `Motivo: ${empresa.motivoEstado}. ` : ''}Para mais informações, contacte a loja.
    </FuncionalidadeIndisponivel>}
    {empresa.estado === 'APROVADA' && <div className="conta-bloco">
      <h2>Empresa aprovada</h2>
      <p>As contas de empresa compram através de cotações: peça o preço para as quantidades de que precisa.</p>
      <div className="conta-links"><Link className="botao botao-laranja botao-pequeno" to="/empresas">Pedir cotação</Link></div>
    </div>}
    <div className="conta-bloco">
      <h2>Dados da empresa</h2>
      <dl className="conta-dados">
        <div><dt>Nome</dt><dd>{empresa.nome}</dd></div>
        <div><dt>NUIT</dt><dd>{empresa.nuit}</dd></div>
        <div><dt>Tipo de cliente</dt><dd>{TIPOS_CLIENTE[empresa.tipoCliente] || empresa.tipoCliente}</dd></div>
        <div><dt>Estado</dt><dd><EstadoConta valor={empresa.estado} rotulos={ESTADOS_EMPRESA} /></dd></div>
        <div><dt>Endereço de facturação</dt><dd>{[empresa.rua, empresa.bairro, empresa.cidade, empresa.provincia].join(', ')}</dd></div>
        <div><dt>Telefone</dt><dd>{empresa.telefone}</dd></div>
        <div><dt>Email</dt><dd>{empresa.email}</dd></div>
        <div><dt>Registada em</dt><dd>{dataLegivel(empresa.criadoEm)}</dd></div>
        {empresa.decididoEm && <div><dt>{empresa.estado === 'SUSPENSA' ? 'Suspensa em' : 'Aprovada em'}</dt><dd>{dataLegivel(empresa.decididoEm)}</dd></div>}
      </dl>
      <p className="nota">Para alterar os dados fiscais da empresa, contacte a loja.</p>
    </div>
  </>
}
