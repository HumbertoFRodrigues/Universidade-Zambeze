import { dataLegivel, descontoPercentual, formatarMZN, precoAplicado, promocaoValida } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function PriceTag({ produto, tamanho = "normal", mostrarValidade = false, className }) {
  const emPromocao = promocaoValida(produto);

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span
        className={cn(
          "font-heading font-semibold text-foreground",
          tamanho === "grande" ? "text-2xl" : "text-base"
        )}
      >
        {formatarMZN(precoAplicado(produto))}
      </span>

      {emPromocao && (
        <>
          <span className="text-sm text-muted-foreground line-through">
            {formatarMZN(produto.preco)}
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 font-heading text-[0.6rem] uppercase tracking-[0.12em] text-primary">
            -{descontoPercentual(produto)}%
          </span>
        </>
      )}

      {emPromocao && mostrarValidade && produto.promocao_fim && (
        <span className="w-full text-xs text-muted-foreground">
          Promoção válida até {dataLegivel(produto.promocao_fim)}
        </span>
      )}
    </div>
  );
}