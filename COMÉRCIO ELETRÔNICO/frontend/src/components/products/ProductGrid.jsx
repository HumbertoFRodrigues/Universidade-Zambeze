import ProductCard from "./ProductCard";
import { GrelhaEsqueleto } from "@/components/common/ProductCardSkeleton";
import { cn } from "@/lib/utils";

export default function ProductGrid({ produtos = [], carregando = false, className }) {
  if (carregando) return <GrelhaEsqueleto itens={4} />;

  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
    >
      {produtos.map((produto) => (
        <ProductCard key={produto.id} produto={produto} />
      ))}
    </div>
  );
}