import { estadoStock } from "@/lib/format";
import { cn } from "@/lib/utils";

const ESTILOS = {
  disponivel: "border-primary/25 bg-primary/5 text-primary",
  limitado: "border-amber-300 bg-amber-50 text-amber-700",
  esgotado: "border-border bg-muted text-muted-foreground",
};

export default function AvailabilityBadge({ produto, className }) {
  const { chave, etiqueta } = estadoStock(produto);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 font-heading text-[0.6rem] uppercase tracking-[0.14em]",
        ESTILOS[chave],
        className
      )}
    >
      {etiqueta}
    </span>
  );
}