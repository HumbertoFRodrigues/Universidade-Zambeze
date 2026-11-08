import { useState } from "react";
import GrupoFiltro from "./GrupoFiltro";
import SearchForm from "@/components/common/SearchForm";
import FormField from "@/components/forms/FormField";
import { cn } from "@/lib/utils";

const OPCOES_DISPONIBILIDADE = [
  { valor: "todas", etiqueta: "Todos" },
  { valor: "disponivel", etiqueta: "Em stock" },
  { valor: "esgotado", etiqueta: "Esgotado" },
];

const classeOpcao = (activa) =>
  cn(
    "flex min-h-[40px] w-full items-center border-b border-border/60 text-left text-sm transition-colors",
    activa ? "font-medium text-primary" : "text-muted-foreground hover:text-foreground"
  );

const classeChip = (activa) =>
  cn(
    "min-h-[36px] rounded-full border px-4 font-heading text-[0.62rem] uppercase tracking-[0.14em] transition-colors",
    activa
      ? "border-primary bg-primary/5 text-primary"
      : "border-border text-muted-foreground hover:border-primary hover:text-primary"
  );

export default function FiltrosCatalogo({
  filtros,
  termo,
  marcas = [],
  categorias = [],
  contagens = {},
  temFiltros,
  onDefinirFiltro,
  onAlternarCategoria,
  onAlternarMarca,
  onLimpar,
  className,
}) {
  const [preco, setPreco] = useState({ min: filtros.precoMin, max: filtros.precoMax });
  const [prevFiltros, setPrevFiltros] = useState({ min: filtros.precoMin, max: filtros.precoMax });
  if (prevFiltros.min !== filtros.precoMin || prevFiltros.max !== filtros.precoMax) {
    setPrevFiltros({ min: filtros.precoMin, max: filtros.precoMax });
    setPreco({ min: filtros.precoMin, max: filtros.precoMax });
  }

  const aplicarPreco = () => {
    onDefinirFiltro("precoMin", preco.min);
    onDefinirFiltro("precoMax", preco.max);
  };

  const aoTeclarPreco = (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault();
      aplicarPreco();
    }
  };

  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-border px-5 lg:sticky lg:top-24 lg:border-0 lg:px-0",
        className
      )}
    >
      <div className="flex items-center justify-between py-4">
        <p className="font-heading text-[0.68rem] uppercase tracking-[0.16em] text-foreground">
          Filtros
        </p>
        {temFiltros && (
          <button
            type="button"
            onClick={onLimpar}
            className="font-heading text-[0.62rem] uppercase tracking-[0.14em] text-primary underline-offset-4 hover:underline"
          >
            Limpar
          </button>
        )}
      </div>

      <GrupoFiltro titulo="Pesquisa">
        <SearchForm id="pesquisa-catalogo" />
        {termo && (
          <p className="mt-3 text-xs text-muted-foreground">Termo activo: “{termo}”</p>
        )}
      </GrupoFiltro>

      <GrupoFiltro titulo="Categoria">
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => onAlternarCategoria("")}
            aria-pressed={!filtros.categoria}
            className={classeOpcao(!filtros.categoria)}
          >
            Todas as categorias
          </button>
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              type="button"
              onClick={() => onAlternarCategoria(categoria.nome)}
              aria-pressed={filtros.categoria === categoria.nome}
              className={classeOpcao(filtros.categoria === categoria.nome)}
            >
              <span className="truncate pr-3">{categoria.nome}</span>
              <span className="ml-auto shrink-0 pl-3 text-[0.62rem] text-muted-foreground">
                {contagens?.[categoria.nome] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </GrupoFiltro>

      <GrupoFiltro titulo="Marca">
        {marcas.length === 0 ? (
          <p className="text-xs text-muted-foreground">Sem marcas disponíveis.</p>
        ) : (
          <ul className="flex max-h-56 flex-col gap-2.5 overflow-y-auto pr-1">
            {marcas.map((marca) => (
              <li key={marca.id || marca.nome || marca}>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={filtros.marcas.includes(marca)}
                    onChange={() => onAlternarMarca(marca)}
                    className="h-4 w-4 accent-[hsl(var(--primary))]"
                  />
                  {typeof marca === "string" ? marca : marca.nome}
                </label>
              </li>
            ))}
          </ul>
        )}
      </GrupoFiltro>

      <GrupoFiltro titulo="Preço (MZN)">
        <div className="flex items-end gap-3">
          <FormField
            id="preco-min"
            label="Mínimo"
            type="number"
            min="0"
            step="50"
            inputMode="numeric"
            placeholder="0"
            value={preco.min}
            onChange={(evento) => setPreco((anterior) => ({ ...anterior, min: evento.target.value }))}
            onBlur={aplicarPreco}
            onKeyDown={aoTeclarPreco}
          />
          <FormField
            id="preco-max"
            label="Máximo"
            type="number"
            min="0"
            step="50"
            inputMode="numeric"
            placeholder="10000"
            value={preco.max}
            onChange={(evento) => setPreco((anterior) => ({ ...anterior, max: evento.target.value }))}
            onBlur={aplicarPreco}
            onKeyDown={aoTeclarPreco}
          />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          O intervalo considera o preço promocional sempre que o produto está em promoção.
        </p>
      </GrupoFiltro>

      <GrupoFiltro titulo="Disponibilidade">
        <div className="flex flex-wrap gap-2">
          {OPCOES_DISPONIBILIDADE.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => onDefinirFiltro("disponibilidade", opcao.valor)}
              aria-pressed={filtros.disponibilidade === opcao.valor}
              className={classeChip(filtros.disponibilidade === opcao.valor)}
            >
              {opcao.etiqueta}
            </button>
          ))}
        </div>
      </GrupoFiltro>

      <GrupoFiltro titulo="Promoção" className="border-b-0">
        <label className="flex cursor-pointer items-center gap-3 text-sm text-foreground">
          <input
            type="checkbox"
            checked={filtros.promocao}
            onChange={(evento) => onDefinirFiltro("promocao", evento.target.checked)}
            className="h-4 w-4 accent-[hsl(var(--primary))]"
          />
          Apenas produtos em promoção
        </label>
      </GrupoFiltro>
    </div>
  );
}