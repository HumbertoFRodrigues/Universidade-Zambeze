import { Minus, Plus, Trash2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useCart } from "./CartProvider";
import { nomeMarca, formatarMZN, precoAplicado} from "@/lib/format";

export default function CartItemRow({ item }) {
  const { alterarQuantidade, remover } = useCart();
  const preco = precoAplicado(item);

  return (
    <div className="flex gap-4 border-b border-border py-4">
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[var(--radius)] bg-muted">
        <Image
          src={item.imagem_principal}
          alt={`${item.nome}${item.categoria?.nome || item.categoria ? ` — ${item.categoria?.nome || item.categoria}` : ""}`}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col">
        {item.marca && (
          <p className="font-heading text-[0.6rem] uppercase tracking-[0.16em] text-muted-foreground">
            {nomeMarca(item.marca)}
          </p>
        )}
        <p className="text-sm font-medium leading-snug text-foreground">{item.nome}</p>
        <p className="mt-1 text-sm text-foreground">{formatarMZN(preco)}</p>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => alterarQuantidade(item.id, item.quantidade - 1)}
              disabled={item.quantidade <= 1}
              aria-label={`Diminuir quantidade de ${item.nome}`}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span aria-live="polite" className="w-8 text-center font-heading text-sm text-foreground">
              {item.quantidade}
            </span>
            <button
              type="button"
              onClick={() => alterarQuantidade(item.id, item.quantidade + 1)}
              disabled={item.quantidade >= item.quantidade_stock}
              aria-label={`Aumentar quantidade de ${item.nome}`}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-heading text-sm font-semibold text-foreground">
              {formatarMZN(preco * item.quantidade)}
            </span>
            <button
              type="button"
              onClick={() => remover(item.id)}
              aria-label={`Remover ${item.nome} do carrinho`}
              className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}