import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AVISO_CONTA_EMPRESA, useCarrinho } from '../contexto/CarrinhoContexto.jsx'
import { Foto } from '../components/Foto.jsx'
import { IconeCarrinho } from '../components/IconeCarrinho.jsx'
import { IlustracaoSacolas } from '../components/IlustracaoSacolas.jsx'
import { formatPrice, precoFinal } from '../services/formatar.js'
import { rotuloTamanho } from '../services/tamanhos.js'
import '../styles/carrinho.css'

export function CartPage() {
  const { itens, total, mudarQtd, remover, trocar, limpar, carregando, erro, contaEmpresa } = useCarrinho()
  const [editando, setEditando] = useState('')

  if (contaEmpresa) {
    return <section>
      <h1 className="titulo-icone"><IconeCarrinho tamanho={32} /> Carrinho</h1>
      <div className="carrinho-vazio">
        <div>
          <h2>Conta de empresa</h2>
          <p>{AVISO_CONTA_EMPRESA}</p>
          <Link className="botao botao-laranja" to="/empresas">Pedir cotação</Link>
        </div>
      </div>
    </section>
  }

  if (carregando && !itens.length) {
    return <section>
      <h1 className="titulo-icone"><IconeCarrinho tamanho={32} /> Carrinho</h1>
      <p role="status">A carregar o carrinho…</p>
    </section>
  }

  if (erro && !itens.length) {
    return <section>
      <h1 className="titulo-icone"><IconeCarrinho tamanho={32} /> Carrinho</h1>
      <p className="erro" role="alert">Não foi possível carregar o carrinho: {erro}</p>
    </section>
  }

  if (!itens.length) {
    return <section>
      <h1 className="titulo-icone"><IconeCarrinho tamanho={32} /> Carrinho</h1>
      <div className="carrinho-vazio">
        <IlustracaoSacolas largura={120} />
        <div>
          <h2>O seu carrinho está vazio</h2>
          <p>Escolha os produtos de que precisa e eles aparecem aqui.</p>
          <Link className="botao botao-laranja" to="/produtos">Continuar a comprar</Link>
        </div>
      </div>
    </section>
  }

  return <section>
    <h1 className="titulo-icone"><IconeCarrinho tamanho={32} /> Carrinho</h1>
    <div className="carrinho">
      <div>
        <ul className="itens">
          {itens.map(i => <li key={i.chave} className="card item">
            <div className="item-foto"><Foto produto={i.produto} cor={i.cor} /></div>
            <div className="item-info">
              <Link to={'/produtos/' + i.produto.slug}><b>{i.produto.nome}</b></Link>
              <small>{[i.modelo, i.corNome, i.tamanho && rotuloTamanho(i.produto.tamanhos) + ' ' + i.tamanho].filter(Boolean).join(' · ')}</small>
              <span>{formatPrice(i.preco)} cada</span>
              <div className="item-acoes">
                <div className="qtd">
                  {/* Com uma unidade, o botão passa a remover o produto */}
                  <button type="button" onClick={() => mudarQtd(i.chave, i.qtd - 1)} aria-label={i.qtd === 1 ? 'Remover produto' : 'Tirar uma unidade'}>
                    {i.qtd === 1 ? '×' : '−'}
                  </button>
                  <b>{i.qtd}</b>
                  <button type="button" onClick={() => mudarQtd(i.chave, i.qtd + 1)} aria-label="Mais uma unidade">+</button>
                </div>
                <button type="button" className="link" onClick={() => setEditando(editando === i.chave ? '' : i.chave)}>Alterar</button>
                <button type="button" className="remover" onClick={() => remover(i.chave)}>
                  {i.qtd > 1 ? 'Remover todos' : 'Remover'}
                </button>
              </div>
            </div>
            <strong>{formatPrice(i.preco * i.qtd)}</strong>
            {editando === i.chave && (
              <Editor key={i.chave} item={i} aoCancelar={() => setEditando('')} aoGuardar={novo => { trocar(i.chave, novo); setEditando('') }} />
            )}
          </li>)}
        </ul>
        <div className="carrinho-links">
          <Link to="/produtos" className="continuar">← Continuar a comprar</Link>
          <button type="button" className="esvaziar" onClick={limpar}>Esvaziar carrinho</button>
        </div>
      </div>

      <aside className="card resumo-carrinho">
        <h2>Resumo</h2>
        <div className="linha"><span>Produtos</span><b>{formatPrice(total)}</b></div>
        <p className="nota">Os descontos das promoções e a entrega são calculados no pagamento.</p>
        <Link className="botao botao-laranja grande" to="/pagamento">Finalizar compra</Link>
      </aside>
    </div>
  </section>
}

// Painel para mudar o modelo, a cor ou o tamanho de um item sem sair do carrinho
function Editor({ item, aoGuardar, aoCancelar }) {
  const p = item.produto
  const modelos = p.modelos || []
  const cores = p.cores || []
  const tamanhos = p.tamanhos || []

  const [modelo, setModelo] = useState(Math.max(0, modelos.findIndex(m => m.nome === item.modelo)))
  const [corId, setCorId] = useState(item.cor)
  const [tamanho, setTamanho] = useState(item.tamanho || '')
  const [erro, setErro] = useState('')

  const preco = precoFinal(p, modelo, corId)

  const guardar = () => {
    if (tamanhos.length && !tamanho) return setErro(`Escolha o ${rotuloTamanho(tamanhos).toLowerCase()}.`)
    aoGuardar({
      ...item,
      chave: `${p.slug}|${modelo}|${corId}|${tamanho}`,
      modelo: modelos[modelo]?.nome,
      cor: corId,
      corNome: cores.find(c => c.id === corId)?.nome,
      tamanho,
      preco,
    })
  }

  const rotulo = rotuloTamanho(tamanhos)

  return <div className="editor">
    {cores.length > 1 && <div className="editor-grupo">
      <span>Cor</span>
      <div className="editor-fotos">
        {cores.map(c => (
          <button key={c.id} type="button" className={c.id === corId ? 'ativa' : ''} onClick={() => setCorId(c.id)}>
            <div className="mini"><Foto produto={p} cor={c.id} /></div>
            <small>{c.nome}</small>
          </button>
        ))}
      </div>
    </div>}
    {modelos.length > 1 && <label>Modelo
      <select value={modelo} onChange={e => setModelo(+e.target.value)}>
        {modelos.map((m, i) => <option key={m.nome} value={i}>{m.nome}</option>)}
      </select>
    </label>}
    {tamanhos.length > 0 && <div className="editor-grupo">
      <span>{rotulo}</span>
      <div className="editor-tamanhos">
        {tamanhos.map(t => <button key={t} type="button" className={t === tamanho ? 'ativa' : ''} onClick={() => { setTamanho(t); setErro('') }}>{t}</button>)}
      </div>
    </div>}
    <div className="editor-fim">
      <b>{formatPrice(preco)}</b>
      <button type="button" className="botao botao-pequeno" onClick={guardar}>Guardar</button>
      <button type="button" className="link" onClick={aoCancelar}>Cancelar</button>
    </div>
    {erro && <p className="erro" role="alert">{erro}</p>}
  </div>
}