import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Foto } from './Foto.jsx'
import { SeletorCor } from './SeletorCor.jsx'
import { Estrelas } from './Estrelas.jsx'
import { IconeCarrinho } from './IconeCarrinho.jsx'
import { useCarrinho } from '../contexto/CarrinhoContexto.jsx'
import { formatPrice, precoBase, extraDaCor } from '../services/formatar.js'
import '../styles/cartao.css'

// Mantido porque outras páginas importam daqui
export { formatPrice }

export function ProductCard({ produto }) {
  const cores = produto.cores || []
  const [corId, setCorId] = useState(cores[0]?.id)
  const { adicionar } = useCarrinho()

  const preco = precoBase(produto) + extraDaCor(produto, corId)
  const temTamanhos = (produto.tamanhos || []).length > 0
  const nomeCor = cores.find(c => c.id === corId)?.nome
  const ligacao = '/produtos/' + produto.slug

  // Só aparece uma etiqueta, a mais importante
  const etiqueta = produto.emPromocao || produto.oferta ? 'Oferta' : produto.novo || produto.lancamento ? 'Novo' : produto.maisVendido ? 'Mais vendido' : produto.destaque ? 'Destaque' : ''

  const comprar = () => {
    const modelo = produto.modelos?.[0]
    adicionar({
      chave: `${produto.slug}|0|${corId}|`,
      produto, cor: corId, corNome: nomeCor, modelo: modelo?.nome, tamanho: '',
      preco, qtd: 1,
    })
  }

  return <article className="card cartao">
    <Link to={ligacao} className="cartao-foto">
      <Foto produto={produto} cor={corId} />
      {etiqueta && <span className="etiqueta">{etiqueta}</span>}
    </Link>
    <div className="cartao-corpo">
      <small className="cartao-categoria">{produto.categoria?.nome}</small>
      <h2><Link to={ligacao}>{produto.nome}</Link></h2>
      {produto.nota > 0 && <div className="cartao-avaliacao"><Estrelas nota={produto.nota} /><small>{produto.avaliacoes} avaliações</small></div>}
      {cores.length > 1 && (
        <div className="cartao-cores">
          <SeletorCor cores={cores} atual={corId} aoEscolher={setCorId} />
          <small>{nomeCor}</small>
        </div>
      )}
      <div className="cartao-rodape">
        <div>
          <small>{produto.modelos?.length > 1 ? 'a partir de' : 'preço'}</small>
          <strong>{formatPrice(preco, produto.codigoMoeda)}</strong>
        </div>
        <div className="cartao-botoes">
          {temTamanhos
            ? <Link className="botao botao-pequeno" to={ligacao}>Escolher tamanho</Link>
            : <button type="button" className="botao botao-pequeno" onClick={comprar}>Adicionar</button>}
          {/* Atalho para abrir o carrinho sem subir à página */}
          <Link to="/carrinho" className="atalho-carrinho" aria-label="Ver o carrinho" title="Ver o carrinho"><IconeCarrinho tamanho={20} /></Link>
        </div>
      </div>
    </div>
  </article>
}