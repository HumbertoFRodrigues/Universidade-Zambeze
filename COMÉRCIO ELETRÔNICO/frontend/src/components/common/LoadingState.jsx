import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function BarraProgresso() {
  return (
    <div
      role="progressbar"
      aria-label="A carregar"
      className="fixed inset-x-0 top-0 z-[70] h-[2px] overflow-hidden bg-primary/10"
    >
      <div className="h-full w-1/3 animate-progress-streak bg-primary" />
    </div>
  );
}

export default function LoadingState({ mensagem = "A carregar conteúdo…", className }) {
  return (
    <div
      role="status"
      className={cn("flex flex-col items-center justify-center gap-3 py-16", className)}
    >
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      <p className="font-heading text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
        {mensagem}
      </p>
    </div>
  );
}