import { cn } from "@/lib/utils";

export default function GrupoFiltro({ titulo, children, className }) {
  return (
    <div className={cn("border-b border-border py-5", className)}>
      <p className="font-heading text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
        {titulo}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  );
}