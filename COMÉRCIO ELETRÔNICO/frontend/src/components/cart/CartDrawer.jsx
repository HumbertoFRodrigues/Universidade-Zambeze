import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import EmptyState from "@/components/common/EmptyState";
import FeedbackMessage from "@/components/common/FeedbackMessage";
import CartItemRow from "./CartItemRow";
import { useCart } from "./CartProvider";
import { formatarMZN } from "@/lib/format";

export default function CartDrawer() {
  const {
    itens,
    aberto,
    abrirCarrinho,
    fecharCarrinho,
    subtotal,
    contagem,
    esvaziar,
    mensagem,
    limparMensagem,
  } = useCart();
  const [avisoCheckout, setAvisoCheckout] = useState(false);

  const fechar = () => {
    setAvisoCheckout(false);
    fecharCarrinho();
  };

  return (
    <Sheet open={aberto} onOpenChange={(valor) => (valor ? abrirCarrinho() : fechar())}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-6 py-5 text-left">
          <SheetTitle className="font-heading text-sm uppercase tracking-[0.16em] text-foreground">
            Carrinho{contagem > 0 ? ` · ${contagem}` : ""}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {mensagem && (
            <FeedbackMessage
              variante="aviso"
              titulo={mensagem}
              onFechar={limparMensagem}
              className="my-4"
            />
          )}

          {itens.length === 0 ? (
            <EmptyState
              className="mt-10 border-0"
              Icone={ShoppingCart}
              titulo="O carrinho está vazio"
              descricao="Explore as categorias e adicione os equipamentos de que precisa."
              accao={
                <button
                  type="button"
                  onClick={fechar}
                  className="min-h-[44px] rounded-[var(--radius)] border border-border px-5 font-heading text-xs uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  Continuar a explorar
                </button>
              }
            />
          ) : (
            <div className="pb-2">
              {itens.map((item) => (
                <CartItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {itens.length > 0 && (
          <div className="border-t border-border px-6 py-5">
            <div className="flex items-baseline justify-between">
              <span className="font-heading text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                Subtotal (sem frete)
              </span>
              <span className="font-heading text-xl font-semibold text-foreground">
                {formatarMZN(subtotal)}
              </span>
            </div>

            {avisoCheckout && (
              <FeedbackMessage
                className="mt-4"
                variante="info"
                titulo="Confirmação da encomenda na próxima etapa"
                onFechar={() => setAvisoCheckout(false)}
              >
                O checkout e o pagamento simulado (Módulo 05 — Checkout e pagamentos) entram na
                próxima fase do projecto. O carrinho fica guardado neste dispositivo.
              </FeedbackMessage>
            )}

            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setAvisoCheckout(true)}
                className="min-h-[44px] rounded-[var(--radius)] bg-primary px-6 font-heading text-xs uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Finalizar compra
              </button>
              <button
                type="button"
                onClick={esvaziar}
                className="min-h-[44px] rounded-[var(--radius)] px-6 font-heading text-xs uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-destructive"
              >
                Esvaziar carrinho
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}