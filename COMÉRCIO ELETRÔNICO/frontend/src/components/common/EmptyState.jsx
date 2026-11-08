import { cn } from "@/lib/utils";

export default function EmptyState({ Icone, titulo, descricao, accao, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius)] border border-dashed border-border px-6 py-16 text-center",
        className
      )}
    >
      {Icone && <Icone className="h-6 w-6 text-muted-foreground" aria-hidden="true" />}
      <p className="font-heading text-sm font-semibold tracking-tight text-foreground">{titulo}</p>
      {descricao && (
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{descricao}</p>
      )}
      {accao && <div className="mt-2">{accao}</div>}
    </div>
  );
}