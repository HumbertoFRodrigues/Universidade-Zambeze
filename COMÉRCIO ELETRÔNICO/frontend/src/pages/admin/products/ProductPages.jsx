import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowDown,
  ArrowUp,
  ExternalLink,
  ImageOff,
  Pencil,
  Plus,
  Star,
  Trash2,
} from 'lucide-react'
import { api, produtosApi } from '../../../services/api.js'
import { useCategoriasAdmin } from '../../../hooks/useCategoriasAdmin.js'
import { formatarMZN } from '../../../lib/format.js'
import {
  AVISO_SEM_CATEGORIA,
  dataHoraLegivel,
  especificacoesParaLista,
  estadoStockAdmin,
  limiarEfectivo,
  listaParaEspecificacoes,
  payloadProduto,
  precoValido,
} from '../../../lib/produtosAdmin.js'
import ProdutoAdminPagina from '../../../components/admin/ProdutoAdminPagina.jsx'
import ProductForm from '../../../components/admin/ProductForm.jsx'
import SpecsEditor from '../../../components/admin/SpecsEditor.jsx'
import ConfirmarApagar from '../../../components/admin/ConfirmarApagar.jsx'
import HistoricoAuditoria from '../../../components/admin/HistoricoAuditoria.jsx'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import LoadingState from '@/components/common/LoadingState'
import FeedbackMessage from '@/components/common/FeedbackMessage'

function Titulo({ children }) {
  return <CardTitle className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-slate-600">{children}</CardTitle>
}

function Mensagens({ erro, sucesso, onFechar }) {
  return <>
    {erro && <FeedbackMessage variante="erro" onFechar={onFechar}>{erro}</FeedbackMessage>}
    {sucesso && <FeedbackMessage variante="sucesso" onFechar={onFechar}>{sucesso}</FeedbackMessage>}
  </>
}

function useMensagens() {
  const [mensagens, setMensagens] = useState({ erro: '', sucesso: '' })
  return {
    ...mensagens,
    erroMsg: erro => setMensagens({ erro, sucesso: '' }),
    sucessoMsg: sucesso => setMensagens({ erro: '', sucesso }),
    limpar: () => setMensagens({ erro: '', sucesso: '' }),
  }
}

// ==================== Criação ====================

export function ProductCreatePage() {
  const navigate = useNavigate()
  const { categorias, erro } = useCategoriasAdmin()

  const criar = async dados => {
    const resposta = await produtosApi.criar(dados)
    navigate(`/admin/produtos/${encodeURIComponent(resposta.produto.id)}`, {
      state: { aviso: 'Produto criado com sucesso. Pode agora adicionar imagens, especificações e garantia.' },
    })
  }

  return (
    <section className="space-y-6">
      <div>
        <Link to="/admin/produtos" className="text-sm text-muted-foreground hover:text-foreground">← Produtos</Link>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight">Novo produto</h1>
        <p className="text-sm text-muted-foreground">Os campos assinalados com * são obrigatórios.</p>
      </div>
      {erro && <FeedbackMessage variante="erro" titulo="Não foi possível carregar as categorias.">{erro}</FeedbackMessage>}
      {!categorias && !erro && <LoadingState mensagem="A carregar categorias…" />}
      {categorias && (
        <Card>
          <CardContent className="pt-6">
            {!categorias.some(categoria => categoria.activo) && (
              <FeedbackMessage variante="aviso" className="mb-6">
                Não existem categorias activas. É necessário existir pelo menos uma categoria para criar produtos.
              </FeedbackMessage>
            )}
            <ProductForm categorias={categorias} onSubmeter={criar} onCancelar={() => navigate('/admin/produtos')} />
          </CardContent>
        </Card>
      )}
    </section>
  )
}

// ==================== Detalhes ====================

function DetalheProduto({ produto, definirProduto }) {
  const location = useLocation()
  const { erro, sucesso, erroMsg, sucessoMsg, limpar } = useMensagens()
  const [confirmar, setConfirmar] = useState(false)
  const [aProcessar, setAProcessar] = useState(false)
  const [avisoCriacao, setAvisoCriacao] = useState(location.state?.aviso || '')
  const stock = estadoStockAdmin(produto)
  const especificacoes = especificacoesParaLista(produto.especificacoes)
  const imagemPrincipal = produto.imagens?.[0]
  const promocoes = (produto.promocoes || []).map(item => item.promocao)

  const desactivar = async () => {
    setAProcessar(true)
    try {
      const resposta = await produtosApi.apagar(produto.id)
      definirProduto({ ...produto, activo: resposta.produto.activo })
      sucessoMsg('Produto desactivado. Deixou de estar visível na loja.')
    } catch (error) {
      erroMsg(error.message)
    } finally {
      setAProcessar(false)
    }
  }

  const reactivar = async () => {
    if (!produto.categoria) return erroMsg(AVISO_SEM_CATEGORIA)
    setAProcessar(true)
    try {
      const resposta = await produtosApi.actualizar(produto.id, payloadProduto(produto, { activo: true }))
      definirProduto(resposta.produto)
      sucessoMsg('Produto reactivado.')
    } catch (error) {
      erroMsg(error.message)
    } finally {
      setAProcessar(false)
    }
  }

  return (
    <div className="space-y-6">
      {avisoCriacao && <FeedbackMessage variante="sucesso" onFechar={() => setAvisoCriacao('')}>{avisoCriacao}</FeedbackMessage>}
      <Mensagens erro={erro} sucesso={sucesso} onFechar={limpar} />

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm"><Link to="editar"><Pencil className="h-4 w-4" />Editar</Link></Button>
        {produto.activo && (
          <Button asChild size="sm" variant="outline">
            <a href={`/produtos/${encodeURIComponent(produto.slug)}`} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />Ver na loja
            </a>
          </Button>
        )}
        {produto.activo
          ? <Button size="sm" variant="destructive" disabled={aProcessar} onClick={() => setConfirmar(true)}>Desactivar</Button>
          : <Button size="sm" variant="outline" disabled={aProcessar} onClick={reactivar}>{aProcessar ? 'A reactivar…' : 'Reactivar'}</Button>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <Titulo>Imagens</Titulo>
            <Link to="imagens" className="text-sm text-primary hover:underline">Gerir</Link>
          </CardHeader>
          <CardContent>
            {imagemPrincipal ? (
              <div className="space-y-3">
                <img src={imagemPrincipal.url} alt={imagemPrincipal.textoAlternativo || produto.nome} className="aspect-square w-full rounded-md border bg-slate-50 object-contain" />
                {produto.imagens.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    {produto.imagens.slice(1).map(imagem => (
                      <img key={imagem.id} src={imagem.url} alt={imagem.textoAlternativo || ''} loading="lazy" className="h-16 w-16 rounded border bg-slate-50 object-cover" />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground">
                <ImageOff className="h-6 w-6" aria-hidden="true" />
                Sem imagens
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader><Titulo>Informação geral</Titulo></CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Preço</dt><dd className="font-mono font-semibold">{formatarMZN(produto.preco)} <span className="text-xs text-muted-foreground">({produto.codigoMoeda})</span></dd></div>
                <div>
                  <dt className="text-muted-foreground">Stock</dt>
                  <dd className="flex items-center gap-2"><span className="font-mono font-semibold">{produto.quantidadeStock} un.</span><Badge className={stock.classe}>{stock.etiqueta}</Badge></dd>
                  <dd className="text-xs text-muted-foreground">Limiar de stock baixo: {limiarEfectivo(produto)}{produto.limiarStockBaixo == null ? ' (predefinido)' : ''}</dd>
                </div>
                <div><dt className="text-muted-foreground">Categoria</dt><dd>{produto.categoria?.nome || 'Sem categoria'}</dd></div>
                <div><dt className="text-muted-foreground">Marca</dt><dd>{produto.marca || '—'}</dd></div>
                <div><dt className="text-muted-foreground">Código</dt><dd className="font-mono">{produto.codigo || '—'}</dd></div>
                <div><dt className="text-muted-foreground">Slug</dt><dd className="break-all font-mono text-xs">{produto.slug}</dd></div>
                <div><dt className="text-muted-foreground">Criado em</dt><dd>{dataHoraLegivel(produto.criadoEm)}</dd></div>
                <div><dt className="text-muted-foreground">Actualizado em</dt><dd>{dataHoraLegivel(produto.actualizadoEm)}</dd></div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><Titulo>Descrição</Titulo></CardHeader>
            <CardContent>
              {produto.descricao
                ? <p className="whitespace-pre-line text-sm leading-relaxed">{produto.descricao}</p>
                : <p className="text-sm text-muted-foreground">Sem descrição.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <Titulo>Especificações</Titulo>
            <Link to="especificacoes" className="text-sm text-primary hover:underline">Gerir</Link>
          </CardHeader>
          <CardContent>
            {especificacoes.length ? (
              <dl className="divide-y text-sm">
                {especificacoes.map(item => (
                  <div key={item.nome} className="grid grid-cols-2 gap-4 py-2">
                    <dt className="text-muted-foreground">{item.nome}</dt>
                    <dd className="break-words">{item.valor}</dd>
                  </div>
                ))}
              </dl>
            ) : <p className="text-sm text-muted-foreground">Sem especificações registadas.</p>}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
              <Titulo>Garantia</Titulo>
              <Link to="garantia" className="text-sm text-primary hover:underline">Gerir</Link>
            </CardHeader>
            <CardContent>
              {produto.garantia
                ? <p className="whitespace-pre-line text-sm">{produto.garantia}</p>
                : <p className="text-sm text-muted-foreground">Sem garantia definida para este produto.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><Titulo>Promoções activas</Titulo></CardHeader>
            <CardContent>
              {promocoes.length ? (
                <ul className="space-y-2 text-sm">
                  {promocoes.map(promocao => (
                    <li key={promocao.id} className="flex flex-wrap justify-between gap-2">
                      <span>{promocao.nome}</span>
                      <span className="text-muted-foreground">
                        {promocao.tipoDesconto === 'PERCENTAGEM' ? `${Number(promocao.valorDesconto)}%` : formatarMZN(promocao.valorDesconto)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted-foreground">Nenhuma promoção activa associada.</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmarApagar
        aberto={confirmar}
        onOpenChange={setConfirmar}
        titulo="Desactivar produto?"
        descricao={`"${produto.nome}" deixará de estar visível na loja. O histórico de encomendas mantém-se e pode reactivá-lo depois.`}
        rotuloConfirmar="Desactivar"
        onConfirmar={desactivar}
      />
    </div>
  )
}

export function ProductDetailPage() {
  return <ProdutoAdminPagina titulo="Detalhes do produto">{props => <DetalheProduto {...props} />}</ProdutoAdminPagina>
}

// ==================== Edição ====================

function EdicaoProduto({ produto, definirProduto }) {
  const navigate = useNavigate()
  const { categorias, erro: erroCategorias } = useCategoriasAdmin()
  const [sucesso, setSucesso] = useState('')

  const guardar = async dados => {
    setSucesso('')
    const resposta = await produtosApi.actualizar(produto.id, payloadProduto(produto, dados))
    definirProduto(resposta.produto)
    setSucesso('Alterações guardadas.')
  }

  if (erroCategorias) return <FeedbackMessage variante="erro" titulo="Não foi possível carregar as categorias.">{erroCategorias}</FeedbackMessage>
  if (!categorias) return <LoadingState mensagem="A carregar categorias…" />

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">
        {sucesso && <FeedbackMessage variante="sucesso" onFechar={() => setSucesso('')}>{sucesso}</FeedbackMessage>}
        <ProductForm
          produto={produto}
          categorias={categorias}
          onSubmeter={guardar}
          onCancelar={() => navigate(`/admin/produtos/${encodeURIComponent(produto.id)}`)}
        />
      </CardContent>
    </Card>
  )
}

export function ProductEditPage() {
  return (
    <ProdutoAdminPagina titulo="Editar produto" descricao="Preço, imagens, especificações e garantia têm páginas próprias.">
      {props => <EdicaoProduto {...props} />}
    </ProdutoAdminPagina>
  )
}

// ==================== Imagens ====================

const imagensDoProduto = produto =>
  (produto.imagens || []).map(imagem => ({ url: imagem.url, textoAlternativo: imagem.textoAlternativo || '' }))

function urlImagemValida(url) {
  if (url.startsWith('/')) return true
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol)
  } catch {
    return false
  }
}

function GestorImagens({ produto, definirProduto }) {
  const [lista, setLista] = useState(() => imagensDoProduto(produto))
  const [nova, setNova] = useState({ url: '', textoAlternativo: '' })
  const [erroNova, setErroNova] = useState('')
  const [aGuardar, setAGuardar] = useState(false)
  const { erro, sucesso, erroMsg, sucessoMsg, limpar } = useMensagens()
  const alterado = JSON.stringify(lista) !== JSON.stringify(imagensDoProduto(produto))

  const adicionar = evento => {
    evento.preventDefault()
    const url = nova.url.trim()
    if (!url) return setErroNova('Indique o endereço da imagem.')
    if (url.length > 500 || !urlImagemValida(url)) return setErroNova('Indique um endereço http(s) válido ou um caminho começado por "/" (máx. 500 caracteres).')
    if (lista.some(imagem => imagem.url === url)) return setErroNova('Esta imagem já está na lista.')
    setLista([...lista, { url, textoAlternativo: nova.textoAlternativo.trim() }])
    setNova({ url: '', textoAlternativo: '' })
    setErroNova('')
  }

  const mover = (indice, destino) => {
    if (destino < 0 || destino >= lista.length) return
    const copia = [...lista]
    const [item] = copia.splice(indice, 1)
    copia.splice(destino, 0, item)
    setLista(copia)
  }

  const guardar = async () => {
    if (!produto.categoria) return erroMsg(AVISO_SEM_CATEGORIA)
    setAGuardar(true)
    limpar()
    try {
      const resposta = await produtosApi.actualizar(produto.id, payloadProduto(produto, { imagens: lista }))
      definirProduto(resposta.produto)
      setLista(imagensDoProduto(resposta.produto))
      sucessoMsg('Imagens guardadas.')
    } catch (error) {
      erroMsg(error.message)
    } finally {
      setAGuardar(false)
    }
  }

  return (
    <div className="space-y-6">
      <FeedbackMessage variante="info">
        As imagens são registadas por endereço (URL); o sistema não tem envio de ficheiros. A primeira imagem da lista é a principal.
      </FeedbackMessage>
      <Mensagens erro={erro} sucesso={sucesso} onFechar={limpar} />

      <Card>
        <CardHeader><Titulo>Adicionar imagem</Titulo></CardHeader>
        <CardContent>
          <form onSubmit={adicionar} noValidate className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto] md:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="img-url">Endereço da imagem</Label>
              <Input id="img-url" maxLength={500} placeholder="https://… ou /imagens/…" value={nova.url} onChange={e => setNova({ ...nova, url: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="img-alt">Texto alternativo</Label>
              <Input id="img-alt" maxLength={200} placeholder={produto.nome} value={nova.textoAlternativo} onChange={e => setNova({ ...nova, textoAlternativo: e.target.value })} />
            </div>
            <Button type="submit" variant="outline"><Plus className="h-4 w-4" />Adicionar</Button>
          </form>
          {erroNova && <p className="mt-2 text-xs text-destructive">{erroNova}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <Titulo>Imagens ({lista.length})</Titulo>
          {alterado && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Alterações por guardar</Badge>}
        </CardHeader>
        <CardContent className="space-y-3">
          {!lista.length && <p className="py-6 text-center text-sm text-muted-foreground">Este produto não tem imagens.</p>}
          {lista.map((imagem, indice) => (
            <div key={imagem.url} className="flex flex-col gap-3 rounded-md border p-3 sm:flex-row sm:items-center">
              <img src={imagem.url} alt={imagem.textoAlternativo || ''} loading="lazy" className="h-20 w-20 shrink-0 rounded border bg-slate-50 object-cover" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {indice === 0 && <Badge>Principal</Badge>}
                  <p className="truncate font-mono text-xs text-muted-foreground" title={imagem.url}>{imagem.url}</p>
                </div>
                <Input
                  aria-label={`Texto alternativo da imagem ${indice + 1}`}
                  maxLength={200}
                  placeholder="Texto alternativo"
                  value={imagem.textoAlternativo}
                  onChange={e => setLista(lista.map((item, i) => (i === indice ? { ...item, textoAlternativo: e.target.value } : item)))}
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {indice > 0 && <Button type="button" size="sm" variant="outline" onClick={() => mover(indice, 0)}><Star className="h-4 w-4" />Principal</Button>}
                <Button type="button" size="icon" variant="outline" aria-label="Mover para cima" disabled={indice === 0} onClick={() => mover(indice, indice - 1)}><ArrowUp className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="outline" aria-label="Mover para baixo" disabled={indice === lista.length - 1} onClick={() => mover(indice, indice + 1)}><ArrowDown className="h-4 w-4" /></Button>
                <Button type="button" size="icon" variant="outline" aria-label="Remover imagem" onClick={() => setLista(lista.filter((_, i) => i !== indice))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" disabled={!alterado || aGuardar} onClick={() => setLista(imagensDoProduto(produto))}>Descartar alterações</Button>
        <Button disabled={!alterado || aGuardar} onClick={guardar}>{aGuardar ? 'A guardar…' : 'Guardar imagens'}</Button>
      </div>
    </div>
  )
}

export function ProductImagesPage() {
  return <ProdutoAdminPagina titulo="Imagens do produto">{props => <GestorImagens {...props} />}</ProdutoAdminPagina>
}

// ==================== Especificações ====================

function GestorEspecificacoes({ produto, definirProduto }) {
  const [lista, setLista] = useState(() => especificacoesParaLista(produto.especificacoes))
  const [aGuardar, setAGuardar] = useState(false)
  const { erro, sucesso, erroMsg, sucessoMsg, limpar } = useMensagens()
  const alterado = JSON.stringify(lista) !== JSON.stringify(especificacoesParaLista(produto.especificacoes))

  const guardar = async () => {
    if (!produto.categoria) return erroMsg(AVISO_SEM_CATEGORIA)
    let especificacoes
    try {
      especificacoes = listaParaEspecificacoes(lista, produto.especificacoes)
    } catch (error) {
      return erroMsg(error.message)
    }
    setAGuardar(true)
    limpar()
    try {
      const resposta = await produtosApi.actualizar(produto.id, payloadProduto(produto, { especificacoes }))
      definirProduto(resposta.produto)
      setLista(especificacoesParaLista(resposta.produto.especificacoes))
      sucessoMsg('Especificações guardadas.')
    } catch (error) {
      erroMsg(error.message)
    } finally {
      setAGuardar(false)
    }
  }

  return (
    <div className="space-y-6">
      <Mensagens erro={erro} sucesso={sucesso} onFechar={limpar} />
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <Titulo>Especificações técnicas</Titulo>
          {alterado && <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Alterações por guardar</Badge>}
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Cada especificação é um par nome/valor apresentado na ficha do produto na loja. Os nomes não podem repetir-se.</p>
          <SpecsEditor valor={lista} onChange={setLista} />
        </CardContent>
      </Card>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" disabled={!alterado || aGuardar} onClick={() => setLista(especificacoesParaLista(produto.especificacoes))}>Descartar alterações</Button>
        <Button disabled={!alterado || aGuardar} onClick={guardar}>{aGuardar ? 'A guardar…' : 'Guardar especificações'}</Button>
      </div>
    </div>
  )
}

export function ProductSpecificationsPage() {
  return <ProdutoAdminPagina titulo="Especificações do produto">{props => <GestorEspecificacoes {...props} />}</ProdutoAdminPagina>
}

// ==================== Preços ====================

function GestorPrecos({ produto, definirProduto }) {
  const [valores, setValores] = useState({ novoPreco: '', motivo: '' })
  const [errosCampo, setErrosCampo] = useState({})
  const [aGuardar, setAGuardar] = useState(false)
  const { erro, sucesso, erroMsg, sucessoMsg, limpar } = useMensagens()
  const promocoes = (produto.promocoes || []).map(item => item.promocao)

  const submeter = async evento => {
    evento.preventDefault()
    const erros = {}
    if (!precoValido(valores.novoPreco)) erros.novoPreco = 'Indique um preço maior que zero, com até 2 casas decimais.'
    if (!valores.motivo.trim()) erros.motivo = 'O motivo da alteração é obrigatório.'
    setErrosCampo(erros)
    if (Object.keys(erros).length) return
    setAGuardar(true)
    limpar()
    try {
      const novoPreco = Number(valores.novoPreco.replace(',', '.'))
      const resposta = await produtosApi.alterarPreco(produto.id, { novoPreco, motivo: valores.motivo.trim() })
      definirProduto({ ...produto, preco: resposta.produto.preco, actualizadoEm: resposta.produto.actualizadoEm })
      setValores({ novoPreco: '', motivo: '' })
      sucessoMsg(`Preço actualizado de ${formatarMZN(produto.preco)} para ${formatarMZN(resposta.produto.preco)}.`)
    } catch (error) {
      erroMsg(error.message)
    } finally {
      setAGuardar(false)
    }
  }

  return (
    <div className="space-y-6">
      <Mensagens erro={erro} sucesso={sucesso} onFechar={limpar} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><Titulo>Preço actual</Titulo></CardHeader>
          <CardContent className="space-y-2">
            <p className="font-mono text-3xl font-bold">{formatarMZN(produto.preco)}</p>
            <p className="text-sm text-muted-foreground">Moeda: {produto.codigoMoeda} · Última actualização do produto: {dataHoraLegivel(produto.actualizadoEm)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><Titulo>Alterar preço</Titulo></CardHeader>
          <CardContent>
            <form onSubmit={submeter} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="preco-novo">Novo preço ({produto.codigoMoeda}) *</Label>
                <Input id="preco-novo" type="number" inputMode="decimal" min="0.01" step="0.01" value={valores.novoPreco} onChange={e => setValores({ ...valores, novoPreco: e.target.value })} aria-invalid={!!errosCampo.novoPreco} />
                {errosCampo.novoPreco && <p className="text-xs text-destructive">{errosCampo.novoPreco}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="preco-motivo">Motivo da alteração *</Label>
                <Textarea id="preco-motivo" rows={3} maxLength={255} value={valores.motivo} onChange={e => setValores({ ...valores, motivo: e.target.value })} aria-invalid={!!errosCampo.motivo} />
                {errosCampo.motivo && <p className="text-xs text-destructive">{errosCampo.motivo}</p>}
                <p className="text-xs text-muted-foreground">O preço anterior, o novo e o motivo ficam registados na auditoria.</p>
              </div>
              <Button type="submit" disabled={aGuardar}>{aGuardar ? 'A guardar…' : 'Actualizar preço'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><Titulo>Promoções activas</Titulo></CardHeader>
        <CardContent>
          {promocoes.length ? (
            <ul className="divide-y text-sm">
              {promocoes.map(promocao => (
                <li key={promocao.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="font-medium">{promocao.nome}</span>
                  <span className="text-muted-foreground">
                    {promocao.tipoDesconto === 'PERCENTAGEM' ? `${Number(promocao.valorDesconto)}% de desconto` : `${formatarMZN(promocao.valorDesconto)} de desconto`}
                    {' · '}{dataHoraLegivel(promocao.inicioEm)} a {dataHoraLegivel(promocao.fimEm)}
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Nenhuma promoção activa associada a este produto.</p>}
          <p className="mt-3 text-xs text-muted-foreground">Os descontos são geridos na área de promoções e aplicados automaticamente no checkout.</p>
        </CardContent>
      </Card>

      <HistoricoAuditoria tipoEntidade="produto" idEntidade={produto.id} titulo="Histórico de preços e alterações" actualizacao={produto.preco} />
    </div>
  )
}

export function ProductPricesPage() {
  return <ProdutoAdminPagina titulo="Preços do produto">{props => <GestorPrecos {...props} />}</ProdutoAdminPagina>
}

// ==================== Garantia ====================

function usePoliticaGarantia() {
  const [estado, setEstado] = useState({ politica: undefined, erro: '' })
  useEffect(() => {
    let activo = true
    api('/politicas')
      .then(resposta => {
        if (activo) setEstado({ politica: (resposta.politicas || []).find(item => item.tipoPolitica === 'GARANTIA') || null, erro: '' })
      })
      .catch(error => { if (activo) setEstado({ politica: null, erro: error.message }) })
    return () => { activo = false }
  }, [])
  return estado
}

function GestorGarantia({ produto, definirProduto }) {
  const [garantia, setGarantia] = useState(produto.garantia || '')
  const [aGuardar, setAGuardar] = useState(false)
  const { erro, sucesso, erroMsg, sucessoMsg, limpar } = useMensagens()
  const { politica, erro: erroPolitica } = usePoliticaGarantia()
  const alterado = garantia.trim() !== (produto.garantia || '')

  const guardar = async evento => {
    evento.preventDefault()
    if (!produto.categoria) return erroMsg(AVISO_SEM_CATEGORIA)
    setAGuardar(true)
    limpar()
    try {
      const resposta = await produtosApi.actualizar(produto.id, payloadProduto(produto, { garantia: garantia.trim() }))
      definirProduto(resposta.produto)
      setGarantia(resposta.produto.garantia || '')
      sucessoMsg(resposta.produto.garantia ? 'Garantia guardada.' : 'Garantia removida do produto.')
    } catch (error) {
      erroMsg(error.message)
    } finally {
      setAGuardar(false)
    }
  }

  return (
    <div className="space-y-6">
      <Mensagens erro={erro} sucesso={sucesso} onFechar={limpar} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><Titulo>Garantia do produto</Titulo></CardHeader>
          <CardContent>
            <form onSubmit={guardar} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="garantia-texto">Condições de garantia</Label>
                <Textarea id="garantia-texto" rows={8} value={garantia} onChange={e => setGarantia(e.target.value)} placeholder="Descreva o prazo e as condições de garantia deste produto." />
                <p className="text-xs text-muted-foreground">Texto apresentado na página do produto. Deixe vazio para remover a garantia específica.</p>
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button type="submit" disabled={!alterado || aGuardar}>{aGuardar ? 'A guardar…' : 'Guardar garantia'}</Button>
                <Button type="button" variant="outline" disabled={!alterado || aGuardar} onClick={() => setGarantia(produto.garantia || '')}>Descartar alterações</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><Titulo>Política de garantia da loja</Titulo></CardHeader>
          <CardContent>
            {politica === undefined && !erroPolitica && <p className="text-sm text-muted-foreground">A carregar política…</p>}
            {erroPolitica && <p className="text-sm text-destructive">{erroPolitica}</p>}
            {politica === null && !erroPolitica && <p className="text-sm text-muted-foreground">A loja ainda não tem uma política de garantia publicada.</p>}
            {politica && (
              <div className="space-y-2">
                <p className="font-medium">{politica.titulo} <span className="text-xs text-muted-foreground">(versão {politica.versao})</span></p>
                <p className="max-h-72 overflow-y-auto whitespace-pre-line text-sm text-muted-foreground">{politica.conteudo}</p>
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">Apenas para consulta. A política geral aplica-se a todos os produtos.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function ProductWarrantyPage() {
  return <ProdutoAdminPagina titulo="Garantia do produto">{props => <GestorGarantia {...props} />}</ProdutoAdminPagina>
}
