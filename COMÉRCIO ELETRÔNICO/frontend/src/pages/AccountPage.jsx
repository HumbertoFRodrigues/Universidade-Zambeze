import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext.jsx'
import { ContaCabecalho } from '../components/conta/ContaLayout.jsx'
import { ConsultarEncomenda } from '../components/conta/ConsultarEncomenda.jsx'
import { DadosPerfil } from './customer/ProfilePages.jsx'

// Só atalhos: não há endpoints que permitam mostrar contagens reais por secção.
const GRUPOS = [
  ['A minha conta', [
    ['/conta/perfil', 'Perfil', 'Os seus dados pessoais.'],
    ['/conta/enderecos', 'Endereços', 'Moradas de entrega.'],
    ['/conta/preferencias', 'Preferências', 'Opções da conta.'],
    ['/conta/palavra-passe', 'Palavra-passe', 'Definir uma nova palavra-passe.'],
  ]],
  ['Compras', [
    ['/conta/encomendas', 'Encomendas', 'Estado das suas encomendas.'],
    ['/conta/pagamentos', 'Pagamentos', 'Histórico de pagamentos.'],
    ['/conta/avaliacoes', 'Avaliações', 'Avaliações que fez.'],
  ]],
  ['Pós-venda', [
    ['/conta/devolucoes', 'Devoluções', 'Pedidos de devolução.'],
    ['/conta/reembolsos', 'Reembolsos', 'Reembolsos de pagamentos.'],
    ['/conta/garantias', 'Garantias', 'Pedidos de garantia.'],
  ]],
  ['Apoio ao cliente', [
    ['/conta/reclamacoes', 'Reclamações', 'Reclamações apresentadas.'],
    ['/conta/assistencia', 'Assistência', 'Dúvidas e pedidos de ajuda.'],
  ]],
]

// Painel da conta. A sessão é garantida pelo ContaLayout (AuthContext + /auth/me).
export function AccountPage() {
  const { user } = useAuth()
  // A conta de empresa não tem compras: o resumo é a página da empresa.
  if (user?.perfil === 'EMPRESA') return <Navigate to="/conta/empresa" replace />

  return <>
    <ContaCabecalho titulo="A minha conta" descricao="Consulte os seus dados e aceda a todas as áreas da conta." />

    <div className="conta-bloco">
      <div className="conta-cabecalho__linha">
        <h2>Dados pessoais</h2>
        <Link className="botao botao-claro botao-pequeno" to="/conta/perfil/editar">Editar perfil</Link>
      </div>
      <DadosPerfil utilizador={user} />
    </div>

    <ConsultarEncomenda />

    {GRUPOS.map(([titulo, ligacoes], indice) => (
      <section key={titulo} className="conta-grupo" aria-labelledby={`conta-grupo-${indice}`}>
        <h2 id={`conta-grupo-${indice}`}>{titulo}</h2>
        <ul className="conta-atalhos">
          {ligacoes.map(([to, rotulo, texto]) => (
            <li key={to}><Link className="conta-atalho" to={to}><b>{rotulo}</b><span>{texto}</span></Link></li>
          ))}
        </ul>
      </section>
    ))}
  </>
}
