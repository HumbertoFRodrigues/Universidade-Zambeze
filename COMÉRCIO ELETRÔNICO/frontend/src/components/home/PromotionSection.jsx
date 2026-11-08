import Container from "@/components/common/Container";
import SectionHeading from "@/components/common/SectionHeading";
import FeedbackMessage from "@/components/common/FeedbackMessage";
import { GrelhaEsqueleto } from "@/components/common/ProductCardSkeleton";
import ProductCard from "@/components/products/ProductCard";

export default function PromotionSection({ produtos, carregando, onVerTodas }) {
  return (
    <section id="promocoes" className="scroll-mt-24 border-b border-border bg-muted/40 py-16 lg:py-20">
      <Container>
        <SectionHeading
          eyebrow="Promoções activas"
          titulo="Produtos com preço reduzido"
          descricao="Preço original e preço promocional lado a lado, com o período de validade indicado."
          accao={
            produtos.length > 0 && onVerTodas ? (
              <button
                type="button"
                onClick={onVerTodas}
                className="inline-flex min-h-[44px] items-center rounded-[var(--radius)] border border-border px-5 font-heading text-xs uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Ver todas as promoções
              </button>
            ) : null
          }
        />

        <div className="mt-12">
          {carregando ? (
            <GrelhaEsqueleto itens={4} />
          ) : produtos.length === 0 ? (
            <FeedbackMessage
              variante="info"
              titulo="Neste momento não há promoções activas."
            >
              Assim que forem activadas novas promoções, aparecem aqui com o preço original e o
              preço promocional.
            </FeedbackMessage>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3 xl:grid-cols-4">
              {produtos.map((produto) => (
                <ProductCard key={produto.id} produto={produto} mostrarValidade />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}