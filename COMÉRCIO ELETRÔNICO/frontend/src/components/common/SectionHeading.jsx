import { cn } from "@/lib/utils";

export default function SectionHeading({
  eyebrow,
  titulo,
  descricao,
  accao,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 border-t border-border pt-8 lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="font-heading text-[0.68rem] uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-3 font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          {titulo}
        </h2>
        {descricao && (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{descricao}</p>
        )}
      </div>
      {accao && <div className="lg:pb-1">{accao}</div>}
    </div>
  );
}