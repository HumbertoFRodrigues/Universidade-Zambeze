export function CatalogFilters({
  categorias,
  marcas,
  categoria,
  marcasSelecionadas,
  disponibilidade,
  promocao,
  onCategoria,
  onMarca,
  onDisponibilidade,
  onPromocao,
  onLimpar,
  temFiltros,
}) {
  return (
    <div className="catalogo-filtros">
      <div className="catalogo-filtros__topo">
        <h2>Filtros</h2>
        {temFiltros && <button type="button" onClick={onLimpar}>Limpar</button>}
      </div>

      <details open>
        <summary>Categorias</summary>
        <div className="catalogo-filtros__opcoes">
          <label>
            <input type="radio" name="categoria" checked={!categoria} onChange={() => onCategoria('')} />
            <span>Todas as categorias</span>
          </label>
          {categorias.map(item => (
            <label key={item.id}>
              <input
                type="radio"
                name="categoria"
                value={item.id}
                checked={String(item.id) === categoria || item.nome === categoria}
                onChange={() => onCategoria(item.nome)}
              />
              <span>{item.nome}</span>
              <small>{item.total ?? item.contagem ?? 0}</small>
            </label>
          ))}
        </div>
      </details>

      <details open>
        <summary>Marcas</summary>
        {marcas.length
          ? <div className="catalogo-filtros__opcoes">
              {marcas.map(item => {
                const nome = typeof item === 'string' ? item : item.nome
                const total = typeof item === 'string' ? null : item.total
                return (
                  <label key={nome}>
                    <input
                      type="checkbox"
                      checked={marcasSelecionadas.includes(nome)}
                      onChange={() => onMarca(nome)}
                    />
                    <span>{nome}</span>
                    {total !== null && <small>{total}</small>}
                  </label>
                )
              })}
            </div>
          : <p className="catalogo-filtros__vazio">Não há marcas disponíveis.</p>}
      </details>

      <details open>
        <summary>Disponibilidade</summary>
        <div className="catalogo-filtros__opcoes">
          {[
            { valor: '', texto: 'Todos' },
            { valor: 'em-stock', texto: 'Em stock' },
            { valor: 'esgotado', texto: 'Esgotado' },
          ].map(opcao => (
            <label key={opcao.valor || 'todos'}>
              <input
                type="radio"
                name="disponibilidade"
                checked={disponibilidade === opcao.valor}
                onChange={() => onDisponibilidade(opcao.valor)}
              />
              <span>{opcao.texto}</span>
            </label>
          ))}
        </div>
      </details>

      <details open>
        <summary>Promoções</summary>
        <div className="catalogo-filtros__opcoes">
          <label>
            <input type="checkbox" checked={promocao} onChange={evento => onPromocao(evento.target.checked)} />
            <span>Produtos em promoção</span>
          </label>
        </div>
      </details>
    </div>
  )
}
