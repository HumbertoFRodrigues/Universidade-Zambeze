import LoadingState from '../common/LoadingState.jsx'
import { FuncionalidadeIndisponivel } from './ContaLayout.jsx'

// Estados comuns das páginas da conta: a carregar, erro (com nova tentativa) e sem dados.
export function ResultadoConta({ loading, error, recarregar, vazio, mensagem = 'A carregar…', children }) {
  if (loading) return <LoadingState mensagem={mensagem} />
  if (error) {
    return <FuncionalidadeIndisponivel
      titulo="Não foi possível carregar os dados"
      accao={recarregar && <button type="button" className="botao botao-claro botao-pequeno" onClick={recarregar}>Tentar novamente</button>}
    >
      {error}
    </FuncionalidadeIndisponivel>
  }
  if (vazio) return <div className="conta-bloco"><p className="suave">{vazio}</p></div>
  return children
}

export function EstadoConta({ valor, rotulos }) {
  return <span className={`conta-estado conta-estado--${valor}`}>{rotulos[valor] || valor}</span>
}
