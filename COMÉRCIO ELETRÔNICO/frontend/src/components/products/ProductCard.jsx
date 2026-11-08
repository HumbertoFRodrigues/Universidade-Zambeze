import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/components/cart/CartProvider";
import AvailabilityBadge from "./AvailabilityBadge";
import PriceTag from "./PriceTag";
import { estadoStock, nomeMarca } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ProductCard({ produto, mostrarValidade = false, className }) {
  const { adicionar } = useCart();
  const { toast } = useToast();
  const esgotado = estadoStock(produto).chave === "esgotado";

  const aoAdicionar = () => {
    const resultado = adicionar(produto, 1);
    toast({
      title: resultado.ok ? "Adicionado ao carrinho" : "Não foi possível adicionar",
      description: resultado.ok ? produto.nome : resultado.mensagem,
    });
  };

  return (
    <article className={cn("group flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-[var(--radius)] bg-muted">
        <Link
          to={`/produto/${produto.slug || produto.id}`}
          aria-hidden="true"
          tabIndex={-1}
          className="block"
        >
          <Image
            src={produto.imagem_principal}
            alt=""
            className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="absolute left-3 top-3">
          <AvailabilityBadge produto={produto} className="shadow-sm" />
        </div>

        {!esgotado && (
          <button
            type="button"
            onClick={aoAdicionar}
            className="absolute inset-x-3 bottom-3 flex min-h-[44px] translate-y-0 items-center justify-center gap-2 rounded-[var(--radius)] bg-foreground/90 font-heading text-xs uppercase tracking-[0.14em] text-background opacity-100 backdrop-blur transition-all duration-300 lg:translate-y-4 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-visible:translate-y-0 lg:focus-visible:opacity-100"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar ao carrinho
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        {produto.marca && (
          <p className="font-heading text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
            {nomeMarca(produto.marca)}
          </p>
        )}
        <h3 className="mt-1.5 text-base font-medium leading-snug text-foreground">
          <Link to={`/produto/${produto.slug || produto.id}`} className="transition-colors hover:text-primary">
            {produto.nome}
          </Link>
        </h3>
        {produto.categoria && (
          <p className="mt-1 text-xs text-muted-foreground">{produto.categoria?.nome || produto.categoria || "Sem categoria"}</p>
        )}
        <div className="mt-3">
          <PriceTag produto={produto} mostrarValidade={mostrarValidade} />
        </div>
        {esgotado && (
          <p className="mt-3 text-xs text-muted-foreground">
            Sem opção de compra enquanto não houver reposição de stock.
          </p>
        )}
      </div>
    </article>
  );
}