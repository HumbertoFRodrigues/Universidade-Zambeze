import { useEffect, useRef, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { produtosApi } from '../../services/api.js'
import { estadoStockAdmin } from '../../lib/produtosAdmin.js'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Pesquisa de produtos na listagem administrativa (nome, código ou marca).
export default function ProdutoSelector({ produto, onSeleccionar, id = 'produto-selector' }) {
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState({ termo: '', produtos: [], erro: '' })
  const [termo, setTermo] = useState('')
  const temporizador = useRef(null)

  useEffect(() => () => clearTimeout(temporizador.current), [])

  useEffect(() => {
    if (!termo) return undefined
    const controller = new AbortController()
    produtosApi.listar({ pesquisa: termo, limite: 8 }, { signal: controller.signal })
      .then(resposta => setResultado({ termo, produtos: resposta.produtos || [], erro: '' }))
      .catch(error => {
        if (!controller.signal.aborted) setResultado({ termo, produtos: [], erro: error.message })
      })
    return () => controller.abort()
  }, [termo])

  const alterar = valor => {
    setTexto(valor)
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => setTermo(valor.trim()), 300)
  }

  if (produto) {
    const stock = estadoStockAdmin(produto)
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-slate-50 p-3">
        <div className="min-w-0">
          <p className="font-medium">{produto.nome}</p>
          <p className="text-xs text-muted-foreground">{produto.codigo || 'Sem código'} · {produto.categoria?.nome || 'Sem categoria'}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <span>Stock actual: <strong className="font-mono">{produto.quantidadeStock}</strong> un.</span>
            <Badge className={stock.classe}>{stock.etiqueta}</Badge>
            {!produto.activo && <Badge variant="destructive">Inactivo</Badge>}
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onSeleccionar(null)}>Alterar produto</Button>
      </div>
    )
  }

  const aPesquisar = Boolean(termo) && resultado.termo !== termo
  const lista = termo && resultado.termo === termo ? resultado.produtos : []

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Produto *</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input id={id} type="search" className="pl-9" placeholder="Pesquisar por nome, código ou marca" value={texto} onChange={e => alterar(e.target.value)} autoComplete="off" />
      </div>
      {aPesquisar && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />A pesquisar…</p>}
      {!aPesquisar && resultado.erro && termo && <p className="text-xs text-destructive">{resultado.erro}</p>}
      {!aPesquisar && termo && !resultado.erro && !lista.length && <p className="text-xs text-muted-foreground">Nenhum produto encontrado.</p>}
      {lista.length > 0 && (
        <ul className="divide-y rounded-md border bg-white">
          {lista.map(item => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => { onSeleccionar(item); setTexto(''); setTermo('') }}
                className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block font-medium">{item.nome}</span>
                  <span className="text-xs text-muted-foreground">{item.codigo || 'Sem código'}{item.activo ? '' : ' · inactivo'}</span>
                </span>
                <span className="font-mono text-xs">{item.quantidadeStock} un.</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
