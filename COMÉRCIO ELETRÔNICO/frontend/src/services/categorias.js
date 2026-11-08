// Ordem de destaque das categorias principais no cabeçalho e no rodapé.
const ORDEM = ['videovigil', 'redes', 'acessos', 'alarmes', 'incendios', 'cofres', 'cabeca', 'maos']

export const prioridadeCategoria = nome => {
  const chave = String(nome).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const indice = ORDEM.findIndex(termo => chave.includes(termo))
  return indice === -1 ? ORDEM.length : indice
}

export const categoriasPrincipais = categorias => categorias
  .filter(categoria => categoria.categoriaPaiId == null)
  .sort((a, b) => prioridadeCategoria(a.nome) - prioridadeCategoria(b.nome))
