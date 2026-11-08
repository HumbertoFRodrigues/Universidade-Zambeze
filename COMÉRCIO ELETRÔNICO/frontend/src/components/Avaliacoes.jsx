import { useCallback, useEffect, useRef, useState } from 'react'
import { Estrelas } from './Estrelas.jsx'
import { api, avaliacoesApi } from '../services/api.js'
import { useAuth } from '../lib/AuthContext.jsx'
import '../styles/avaliacoes.css'

const ROTULOS = ['', 'Muito fraco', 'Fraco', 'Razoável', 'Bom', 'Excelente']
const ESTADO_TEXTO = {
  PENDENTE: 'A sua avaliação foi enviada e aguarda aprovação da loja.',
  APROVADA: 'A sua avaliação está publicada. Obrigado!',
  REJEITADA: 'A sua avaliação não foi publicada.',
}
const MAX_FOTOS = 4
const MAX_BYTES = 3 * 1024 * 1024
const TIPOS_FOTO = ['image/jpeg', 'image/png', 'image/webp']

// Formulário de avaliação: só aparece a quem comprou e recebeu o produto (encomenda concluída).
// Estrelas, comentário e até 4 fotografias; fica pendente até a loja aprovar.
function AvaliarProduto({ slug }) {
  const { user } = useAuth()
  const [estado, setEstado] = useState({ dados: null, erro: '' })
  const [nota, setNota] = useState(0)
  const [sobre, setSobre] = useState(0)
  const [comentario, setComentario] = useState('')
  const [fotos, setFotos] = useState([])
  const [erroForm, setErroForm] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    if (!user || user.perfil === 'ADMINISTRADOR') return undefined
    const controller = new AbortController()
    avaliacoesApi.minha(slug, { signal: controller.signal })
      .then(dados => setEstado({ dados, erro: '' }))
      .catch(error => { if (!controller.signal.aborted) setEstado({ dados: null, erro: error.message }) })
    return () => controller.abort()
  }, [slug, user])

  // Liberta as pré-visualizações locais quando deixam de ser usadas.
  const fotosRef = useRef(fotos)
  fotosRef.current = fotos
  useEffect(() => () => fotosRef.current.forEach(foto => URL.revokeObjectURL(foto.previa)), [])

  if (!user || user.perfil === 'ADMINISTRADOR' || !estado.dados) return null
  const { podeAvaliar, avaliacao } = estado.dados

  if (mensagem || avaliacao) {
    const situacao = mensagem ? 'PENDENTE' : avaliacao.estado
    return <div className={`avaliar-caixa avaliar-caixa--${situacao.toLowerCase()}`}>
      <b>{mensagem ? 'Avaliação enviada' : 'A sua avaliação'}</b>
      {avaliacao && !mensagem && <Estrelas nota={avaliacao.classificacao} />}
      {avaliacao?.comentario && !mensagem && <p>{avaliacao.comentario}</p>}
      {avaliacao?.imagens?.length > 0 && !mensagem && <div className="avaliacao-fotos">
        {avaliacao.imagens.map(url => <img key={url} src={url} alt="Fotografia enviada na sua avaliação" loading="lazy" />)}
      </div>}
      <p>{mensagem || ESTADO_TEXTO[situacao]}</p>
      {situacao === 'REJEITADA' && avaliacao?.motivoRejeicao && <small>Motivo: {avaliacao.motivoRejeicao}</small>}
    </div>
  }
  if (!podeAvaliar) return null

  const escolherFotos = e => {
    const ficheiros = [...(e.target.files || [])]
    e.target.value = ''
    if (fotos.length + ficheiros.length > MAX_FOTOS) return setErroForm(`Pode juntar no máximo ${MAX_FOTOS} fotografias.`)
    const invalida = ficheiros.find(f => !TIPOS_FOTO.includes(f.type) || f.size > MAX_BYTES)
    if (invalida) return setErroForm(`"${invalida.name}" não é uma fotografia JPG, PNG ou WebP até 3 MB.`)
    setErroForm('')
    setFotos(actuais => [...actuais, ...ficheiros.map(ficheiro => ({ ficheiro, previa: URL.createObjectURL(ficheiro) }))])
  }

  const removerFoto = indice => setFotos(actuais => {
    URL.revokeObjectURL(actuais[indice].previa)
    return actuais.filter((_, i) => i !== indice)
  })

  const enviar = async e => {
    e.preventDefault()
    if (!nota) return setErroForm('Escolha de 1 a 5 estrelas.')
    setErroForm('')
    setEnviando(true)
    try {
      const imagens = []
      for (const foto of fotos) imagens.push((await avaliacoesApi.enviarFoto(slug, foto.ficheiro)).url)
      const resposta = await avaliacoesApi.enviar(slug, { classificacao: nota, comentario, imagens })
      setMensagem(resposta.message)
    } catch (error) {
      setErroForm(error.message)
    } finally {
      setEnviando(false)
    }
  }

  const mostrada = sobre || nota
  return <form className="avaliar-caixa formulario" onSubmit={enviar}>
    <b>Avaliar este produto</b>
    <small className="nota-rodape">Comprou e recebeu este produto. Partilhe a sua experiência com outros clientes.</small>
    <div className="avaliar">
      <div className="escolha" role="radiogroup" aria-label="Classificação" onMouseLeave={() => setSobre(0)}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" role="radio" aria-checked={nota === n} aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
            className={n <= mostrada ? 'ativa' : ''} onMouseEnter={() => setSobre(n)} onClick={() => { setNota(n); setErroForm('') }}>★</button>
        ))}
      </div>
      <small>{mostrada ? ROTULOS[mostrada] : 'Toque nas estrelas para classificar'}</small>
    </div>
    <label htmlFor="avaliacao-comentario">Descrição (opcional)</label>
    <textarea id="avaliacao-comentario" rows={4} maxLength={1000} value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Como correu a utilização do produto? Qualidade, conforto, instalação…" />
    <span className="rotulo-fotos">Fotografias do produto (opcional, até {MAX_FOTOS})</span>
    <div className="fotos-escolhidas">
      {fotos.map((foto, indice) => (
        <figure key={foto.previa}>
          <img src={foto.previa} alt={`Fotografia ${indice + 1} escolhida`} />
          <button type="button" aria-label={`Remover fotografia ${indice + 1}`} onClick={() => removerFoto(indice)}>×</button>
        </figure>
      ))}
      {fotos.length < MAX_FOTOS && <label className="adicionar-foto">
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={escolherFotos} />
        <span>+ Juntar fotografia</span>
      </label>}
    </div>
    {erroForm && <p className="erro" role="alert">{erroForm}</p>}
    <button type="submit" className="botao botao-laranja" disabled={enviando}>{enviando ? 'A enviar…' : 'Enviar avaliação'}</button>
    <small className="nota-rodape">Aparece como "Compra verificada" e é publicada depois de aprovada pela loja.</small>
  </form>
}

// Visualizador de fotografias: imagem grande, anterior/seguinte, teclado e descarga.
function Lightbox({ fotos, indice, onMudar, onFechar }) {
  const foto = fotos[indice]
  const anterior = useCallback(() => onMudar((indice - 1 + fotos.length) % fotos.length), [indice, fotos.length, onMudar])
  const seguinte = useCallback(() => onMudar((indice + 1) % fotos.length), [indice, fotos.length, onMudar])
  const fecharRef = useRef(null)

  useEffect(() => {
    fecharRef.current?.focus()
    const teclas = e => {
      if (e.key === 'Escape') onFechar()
      if (e.key === 'ArrowLeft') anterior()
      if (e.key === 'ArrowRight') seguinte()
    }
    document.addEventListener('keydown', teclas)
    return () => document.removeEventListener('keydown', teclas)
  }, [anterior, seguinte, onFechar])

  return <div className="lightbox" role="dialog" aria-modal="true" aria-label="Fotografias dos clientes" onClick={onFechar}>
    <div className="lightbox__caixa" onClick={e => e.stopPropagation()}>
      <img src={foto.url} alt={`Fotografia de ${foto.nome}`} />
      <div className="lightbox__barra">
        <span>{foto.nome} · {indice + 1} de {fotos.length}</span>
        <a href={foto.url} download className="botao botao-claro">Descarregar</a>
      </div>
      {fotos.length > 1 && <>
        <button type="button" className="lightbox__nav lightbox__nav--ant" aria-label="Fotografia anterior" onClick={anterior}>‹</button>
        <button type="button" className="lightbox__nav lightbox__nav--seg" aria-label="Fotografia seguinte" onClick={seguinte}>›</button>
      </>}
      <button ref={fecharRef} type="button" className="lightbox__fechar" aria-label="Fechar" onClick={onFechar}>×</button>
    </div>
  </div>
}

// Carrossel horizontal com as fotografias das avaliações publicadas.
function CarrosselFotos({ fotos, onAbrir }) {
  const pistaRef = useRef(null)
  const deslocar = sentido => pistaRef.current?.scrollBy({ left: sentido * pistaRef.current.clientWidth * 0.8, behavior: 'smooth' })
  return <section className="carrossel-fotos" aria-label="Fotografias dos clientes">
    <div className="carrossel-fotos__cab">
      <b>Fotografias dos clientes</b>
      <small>{fotos.length} {fotos.length === 1 ? 'fotografia' : 'fotografias'}</small>
      {fotos.length > 3 && <span className="carrossel-fotos__setas">
        <button type="button" aria-label="Anteriores" onClick={() => deslocar(-1)}>‹</button>
        <button type="button" aria-label="Seguintes" onClick={() => deslocar(1)}>›</button>
      </span>}
    </div>
    <div className="carrossel-fotos__pista" ref={pistaRef}>
      {fotos.map((foto, indice) => (
        <button key={`${foto.url}-${indice}`} type="button" onClick={() => onAbrir(indice)} aria-label={`Ver fotografia de ${foto.nome}`}>
          <img src={foto.url} alt={`Fotografia de ${foto.nome}`} loading="lazy" />
        </button>
      ))}
    </div>
  </section>
}

export function Avaliacoes({ slug, notaMedia = 0, totalAvaliacoes = 0 }) {
  const [lista, setLista] = useState([])
  const [total, setTotal] = useState(totalAvaliacoes)
  const [filtro, setFiltro] = useState(0)
  const [slugCarregado, setSlugCarregado] = useState('')
  const loading = Boolean(slug) && slugCarregado !== slug
  const [erro, setErro] = useState('')
  const [aberta, setAberta] = useState(null)

  useEffect(() => {
    if (!slug) return undefined
    const controller = new AbortController()
    api(`/produtos/${encodeURIComponent(slug)}/avaliacoes?limite=50`, { signal: controller.signal })
      .then(resposta => {
        if (controller.signal.aborted) return
        setLista(resposta.avaliacoes || [])
        setTotal(resposta.total || 0)
        setErro('')
      })
      .catch(error => {
        if (!controller.signal.aborted) setErro(error.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setSlugCarregado(slug)
      })
    return () => controller.abort()
  }, [slug])

  const contar = classificacao => lista.filter(avaliacao => avaliacao.nota === classificacao).length
  const visiveis = filtro ? lista.filter(avaliacao => avaliacao.nota === filtro) : lista
  const fotos = lista.flatMap(avaliacao => (avaliacao.imagens || []).map(url => ({ url, nome: avaliacao.nome })))
  const abrirFoto = url => setAberta(fotos.findIndex(foto => foto.url === url))
  const fechar = useCallback(() => setAberta(null), [])

  return <div className="avaliacoes">
    <div className="resumo">
      <div className="media">
        <b>{Number(notaMedia).toFixed(1).replace('.', ',')}</b>
        <Estrelas nota={notaMedia} />
        <small>{total} avaliações</small>
      </div>
      <div className="barras">
        {[5, 4, 3, 2, 1].map(n => (
          <button key={n} type="button" className={filtro === n ? 'ativa' : ''} onClick={() => setFiltro(filtro === n ? 0 : n)}>
            <span>{n} ★</span>
            <i><u className={`largura-${total ? Math.round((contar(n) / total) * 10) * 10 : 0}`} /></i>
            <em>{contar(n)}</em>
          </button>
        ))}
      </div>
    </div>

    {fotos.length > 0 && <CarrosselFotos fotos={fotos} onAbrir={setAberta} />}

    <AvaliarProduto slug={slug} />

    {filtro > 0 && <p>A mostrar avaliações de {filtro} estrelas. <button type="button" className="link" onClick={() => setFiltro(0)}>Ver todas</button></p>}
    {loading && <p role="status">A carregar avaliações…</p>}
    {erro && <p className="erro" role="alert">{erro}</p>}
    {!loading && !erro && <ul className="lista">
      {visiveis.map((avaliacao, indice) => (
        <li key={`${avaliacao.data}-${indice}`}>
          <div className="cabeca">
            <b>{avaliacao.nome}</b>
            {avaliacao.compraVerificada && <span className="verificada">Compra verificada</span>}
            <Estrelas nota={avaliacao.nota} />
            <small>{new Date(avaliacao.data).toLocaleDateString('pt-PT')}</small>
          </div>
          {avaliacao.texto && <p>{avaliacao.texto}</p>}
          {avaliacao.imagens?.length > 0 && <div className="avaliacao-fotos">
            {avaliacao.imagens.map(url => (
              <button key={url} type="button" onClick={() => abrirFoto(url)} aria-label={`Ampliar fotografia de ${avaliacao.nome}`}>
                <img src={url} alt={`Fotografia de ${avaliacao.nome}`} loading="lazy" />
              </button>
            ))}
          </div>}
        </li>
      ))}
      {!visiveis.length && <li>{filtro ? 'Sem avaliações com esta classificação.' : 'Este produto ainda não tem avaliações publicadas.'}</li>}
    </ul>}

    {aberta !== null && aberta >= 0 && <Lightbox fotos={fotos} indice={aberta} onMudar={setAberta} onFechar={fechar} />}
  </div>
}
