import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/components/cart/CartProvider";
import AvailabilityBadge from "./AvailabilityBadge";
import { estadoStock, nomeMarca } from "@/lib/format";
import PriceTag from "./PriceTag";

const MENSAGENS = {
  disponivel: "Disponível para entrega a partir do armazém do vendedor.",
  limitado: "Stock reduzido: confirme a quantidade antes de encomendar volumes maiores.",
  esgotado: "Sem stock neste momento.",
};

export default function PurchasePanel({ produto, loja }) {
  const { adicionar, abrirCarrinho } = useCart();
  const { toast } = useToast();
  const [quantidade, setQuantidade] = useState(1);

  const { chave, etiqueta } = estadoStock(produto);
  const esgotado = chave === "esgotado";
  const stock = Math.max(Number(produto.quantidade_stock || 0), 1);

  const alterarQuantidade = (delta) =>
    setQuantidade((anterior) => Math.min(Math.max(anterior + delta, 1), stock));

  const adicionarAoCarrinho = () => {
    const resultado = adicionar(produto, quantidade);
    if (!resultado.ok) {
      toast({ title: "Não foi possível adicionar", description: resultado.mensagem });
      return;
    }
    toast({
      title: "Adicionado ao carrinho",
      description: `${quantidade} × ${produto.nome}`,
    });
    abrirCarrinho();
  };

  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      {produto.marca && (
        <p className="font-heading text-[0.68rem] uppercase tracking-[0.2em] text-primary">
          {nomeMarca(produto.marca)}
        </p>
      )}
      <h1 className="mt-3 font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground">
        {produto.nome}
      </h1>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <AvailabilityBadge produto={produto} />
        {produto.categoria && (
          <span className="text-xs text-muted-foreground">{produto.categoria?.nome || produto.categoria || "Sem categoria"}</span>
        )}
        {produto.codigo && (
          <span className="font-heading text-xs text-muted-foreground">Ref. {produto.codigo}</span>
        )}
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <PriceTag produto={produto} tamanho="grande" mostrarValidade />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{MENSAGENS[chave]}</p>

      {!esgotado && (
        <div className="mt-6 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => alterarQuantidade(-1)}
              disabled={quantidade <= 1}
              aria-label="Diminuir quantidade"
              className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] border border-border text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span aria-live="polite" className="w-10 text-center font-heading text-base text-foreground">
              {quantidade}
            </span>
            <button
              type="button"
              onClick={() => alterarQuantidade(1)}
              disabled={quantidade >= stock}
              aria-label="Aumentar quantidade"
              className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] border border-border text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <span className="text-xs text-muted-foreground">{etiqueta}</span>
        </div>
      )}

      <button
        type="button"
        onClick={adicionarAoCarrinho}
        disabled={esgotado}
        className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-primary px-6 font-heading text-xs uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:hover:translate-y-0"
      >
        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
        {esgotado ? "Produto esgotado" : "Adicionar ao carrinho"}
      </button>

      {esgotado && loja?.email && (
        <p className="mt-3 text-xs text-muted-foreground">
          Contacte o vendedor para saber a data de reposição:{" "}
          <a href={`mailto:${loja.email}`} className="break-all text-primary hover:underline">
            {loja.email}
          </a>
        </p>
      )}

      {produto.garantia && (
        <p className="mt-6 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
          {produto.garantia}
        </p>
      )}
    </aside>
  );
}