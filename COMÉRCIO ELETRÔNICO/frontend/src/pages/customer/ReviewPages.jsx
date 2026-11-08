import { Link } from 'react-router-dom'
import { ContaCabecalho } from '../../components/conta/ContaLayout.jsx'
import { ResultadoConta } from '../../components/conta/ResultadoConta.jsx'
import { useDadosConta } from '../../hooks/useDadosConta.js'
import { contaApi } from '../../services/api.js'
import { dataLegivel } from '../../lib/format.js'

const estrelas = nota => '★'.repeat(nota) + '☆'.repeat(5 - nota)

// Avaliações feitas pela conta (/conta/avaliacoes): produtos e experiência de compra.
export function ReviewsPage() {
  const { data, error, loading, recarregar } = useDadosConta(opcoes => contaApi.avaliacoes(opcoes), 'avaliacoes')
  const produtos = data?.produtos || []
  const encomendas = data?.encomendas || []
  return <>
    <ContaCabecalho
      titulo="As minhas avaliações"
      descricao="Avaliações que fez aos produtos e às encomendas."
      accao={<Link className="botao botao-claro botao-pequeno" to="/conta/encomendas">Avaliar uma encomenda</Link>}
    />
    <ResultadoConta loading={loading} error={error} recarregar={recarregar} mensagem="A carregar avaliações…"
      vazio={data && !produtos.length && !encomendas.length && 'Ainda não avaliou nenhuma compra. Pode avaliar as encomendas concluídas.'}>
      {produtos.length > 0 && <div className="conta-bloco">
        <h2>Produtos</h2>
        <dl className="conta-dados">
          {produtos.map(a => (
            <div key={a.id}>
              <dt>
                <Link to={`/produtos/${encodeURIComponent(a.itemEncomenda.produto.slug)}`}>{a.itemEncomenda.nomeProduto}</Link>
                <br /><small className="suave">
                  {dataLegivel(a.criadoEm)}
                  {a.itemEncomenda.encomenda && <> · Encomenda {a.itemEncomenda.encomenda.codigoEncomenda}</>}
                  {a.estado && <> · {a.estado === 'PENDENTE' ? 'Aguarda aprovação' : a.estado === 'APROVADA' ? 'Publicada' : 'Não publicada'}</>}
                </small>
              </dt>
              <dd><span aria-label={`${a.classificacao} de 5`}>{estrelas(a.classificacao)}</span>{a.comentario && <><br />{a.comentario}</>}</dd>
            </div>
          ))}
        </dl>
      </div>}
      {encomendas.length > 0 && <div className="conta-bloco">
        <h2>Experiência de compra</h2>
        <dl className="conta-dados">
          {encomendas.map(a => (
            <div key={a.id}>
              <dt>Encomenda {a.encomenda.codigoEncomenda}</dt>
              <dd><span aria-label={`${a.classificacaoExperiencia} de 5`}>{estrelas(a.classificacaoExperiencia)}</span> · {a.recomenda ? 'Recomenda' : 'Não recomenda'}{a.comentario && <><br />{a.comentario}</>}</dd>
            </div>
          ))}
        </dl>
      </div>}
    </ResultadoConta>
  </>
}
