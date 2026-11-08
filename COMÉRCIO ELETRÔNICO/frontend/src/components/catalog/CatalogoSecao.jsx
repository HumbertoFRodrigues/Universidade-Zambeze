import { useState } from "react";
import { PackageSearch, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Container from "@/components/common/Container";
import SectionHeading from "@/components/common/SectionHeading";
import FeedbackMessage from "@/components/common/FeedbackMessage";
import EmptyState from "@/components/common/EmptyState";
import FormSelect from "@/components/forms/FormSelect";
import { BarraProgresso } from "@/components/common/LoadingState";
import { GrelhaEsqueleto } from "@/components/common/ProductCardSkeleton";
import ProductGrid from "@/components/products/ProductGrid";
import FiltrosCatalogo from "./FiltrosCatalogo";
import { cn } from "@/lib/utils";

const OPCOES_ORDEM = [
  { valor: "-created_date", etiqueta: "Mais recentes" },
  { valor: "preco", etiqueta: "Preço: menor primeiro" },
  { valor: "-preco", etiqueta: "Preço: maior primeiro" },
  { valor: "nome", etiqueta: "Nome (A–Z)" },
];

const CLASSE_GRELHA = "md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3";

export default function CatalogoSecao({
  produtos,
  total,
  carregando,
  carregandoMais,
  temMais,
  onCarregarMais,
  termo,
  filtros,
  marcas = [],
  categorias = [],
  contagens = {},
  temFiltros,
  contagemFiltros,
  onDefinirFiltro,
  onAlternarCategoria,
  onAlternarMarca,
  onLimpar,
}) {
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const navigate = useNavigate();

  const limparTudo = () => {
    onLimpar();
    if (termo) navigate("/#produtos");
  };

  const titulo = termo ? `Resultados para “${termo}”` : filtros.categoria || "Catálogo de equipamentos";

  return (
    <section id="produtos" className="scroll-mt-24 py-16 lg:py-20">
      <Container>
        <SectionHeading
          eyebrow="Catálogo"
          titulo={titulo}
          descricao="Pesquise por nome, marca ou categoria e combine filtros de preço, disponibilidade e promoção. As listagens são paginadas."
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[264px_1fr] lg:gap-14">
          <div className={cn(mostrarFiltros ? "block" : "hidden", "lg:block")}>
            <FiltrosCatalogo
              filtros={filtros}
              termo={termo}
              marcas={marcas}
              categorias={categorias}
              contagens={contagens}
              temFiltros={temFiltros}
              onDefinirFiltro={onDefinirFiltro}
              onAlternarCategoria={onAlternarCategoria}
              onAlternarMarca={onAlternarMarca}
              onLimpar={limparTudo}
            />
          </div>

          <div>
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setMostrarFiltros((anterior) => !anterior)}
                  aria-expanded={mostrarFiltros}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-[var(--radius)] border border-border px-4 font-heading text-[0.62rem] uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary hover:text-primary lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  Filtros{contagemFiltros > 0 ? ` (${contagemFiltros})` : ""}
                </button>
                <p
                  aria-live="polite"
                  className="font-heading text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground"
                >
                  {carregando ? "A carregar…" : `${produtos.length} de ${total} produtos`}
                </p>
              </div>

              <FormSelect
                id="ordenar-por"
                label="Ordenar por"
                value={filtros.ordem}
                onChange={(evento) => onDefinirFiltro("ordem", evento.target.value)}
                opcoes={OPCOES_ORDEM}
                className="w-full sm:w-64"
              />
            </div>

            {termo && (
              <FeedbackMessage
                className="mt-6"
                variante="info"
                titulo={`Pesquisa activa: “${termo}”.`}
                onFechar={limparTudo}
              >
                Os resultados juntam o termo pesquisado aos filtros escolhidos.{" "}
                <button
                  type="button"
                  onClick={limparTudo}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Limpar pesquisa e filtros
                </button>
              </FeedbackMessage>
            )}

            <div className="mt-10">
              {carregando ? (
                <GrelhaEsqueleto itens={8} className={CLASSE_GRELHA} />
              ) : produtos.length === 0 ? (
                <EmptyState
                  Icone={PackageSearch}
                  titulo="Nenhum produto encontrado"
                  descricao="Não há produtos activos com estes critérios. Ajuste a pesquisa ou remova alguns filtros."
                  accao={
                    <button
                      type="button"
                      onClick={limparTudo}
                      className="min-h-[44px] rounded-[var(--radius)] border border-border px-6 font-heading text-xs uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      Limpar pesquisa e filtros
                    </button>
                  }
                />
              ) : (
                <>
                  <ProductGrid produtos={produtos} className={CLASSE_GRELHA} />
                  {temMais && (
                    <div className="mt-14 flex justify-center">
                      <button
                        type="button"
                        onClick={onCarregarMais}
                        disabled={carregandoMais}
                        className="inline-flex min-h-[44px] items-center rounded-[var(--radius)] border border-border px-6 font-heading text-xs uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
                      >
                        {carregandoMais
                          ? "A carregar…"
                          : `Ver mais produtos (faltam ${Math.max(total - produtos.length, 0)})`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </Container>

      {carregandoMais && <BarraProgresso />}
    </section>
  );
}