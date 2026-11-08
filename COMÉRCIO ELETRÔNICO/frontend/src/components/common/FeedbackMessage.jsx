import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

const VARIANTES = {
  info: { Icone: Info, caixa: "border-border bg-muted", cor: "text-muted-foreground" },
  sucesso: { Icone: CheckCircle2, caixa: "border-primary/25 bg-primary/5", cor: "text-primary" },
  aviso: { Icone: AlertCircle, caixa: "border-amber-300 bg-amber-50", cor: "text-amber-600" },
  erro: { Icone: AlertCircle, caixa: "border-destructive/30 bg-destructive/5", cor: "text-destructive" },
};

export default function FeedbackMessage({
  variante = "info",
  titulo,
  children,
  accao,
  onFechar,
  className,
}) {
  const { Icone, caixa, cor } = VARIANTES[variante] || VARIANTES.info;

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius)] border px-4 py-3 text-sm",
        caixa,
        className
      )}
    >
      <Icone className={cn("mt-0.5 h-4 w-4 shrink-0", cor)} aria-hidden="true" />
      <div className="flex-1 leading-relaxed">
        {titulo && <p className="font-medium text-foreground">{titulo}</p>}
        {children && <div className="mt-0.5 text-muted-foreground">{children}</div>}
        {accao && <div className="mt-3">{accao}</div>}
      </div>
      {onFechar && (
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar mensagem"
          className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}