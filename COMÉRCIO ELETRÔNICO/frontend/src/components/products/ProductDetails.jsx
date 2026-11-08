import SpecificationsTable from "./SpecificationsTable";
import ProductAssurance from "./ProductAssurance";

export default function ProductDetails({ produto, loja }) {
  return (
    <div className="mt-20 grid gap-14 border-t border-border pt-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-16">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground">
          Descrição
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {produto.descricao || "Descrição detalhada a confirmar com o vendedor."}
        </p>

        {produto.utilizacao_recomendada && (
          <>
            <h3 className="mt-10 font-heading text-sm uppercase tracking-[0.16em] text-foreground">
              Utilização recomendada
            </h3>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {produto.utilizacao_recomendada}
            </p>
          </>
        )}

        <h3 className="mt-10 font-heading text-sm uppercase tracking-[0.16em] text-foreground">
          Especificações técnicas
        </h3>
        <SpecificationsTable especificacoes={produto.especificacoes || []} />
      </div>

      <ProductAssurance produto={produto} loja={loja} />
    </div>
  );
}