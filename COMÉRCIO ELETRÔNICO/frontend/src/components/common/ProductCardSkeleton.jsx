import { cn } from "@/lib/utils";

function CartaoEsqueleto() {
  return (
    <div className="animate-pulse">
      <div className="aspect-square w-full rounded-[var(--radius)] bg-muted" />
      <div className="mt-4 h-2.5 w-20 rounded bg-muted" />
      <div className="mt-3 h-4 w-4/5 rounded bg-muted" />
      <div className="mt-4 h-5 w-28 rounded bg-muted" />
    </div>
  );
}

export function GrelhaEsqueleto({ itens = 8, className }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3 xl:grid-cols-4",
        className
      )}
      aria-hidden="true"
    >
      {Array.from({ length: itens }).map((_, indice) => (
        <CartaoEsqueleto key={indice} />
      ))}
    </div>
  );
}

export default CartaoEsqueleto;