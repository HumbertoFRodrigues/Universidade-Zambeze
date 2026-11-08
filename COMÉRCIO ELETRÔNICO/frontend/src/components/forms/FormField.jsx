import { cn } from "@/lib/utils";

export default function FormField({
  id,
  label,
  erro,
  ajuda,
  className,
  inputClassName,
  ...props
}) {
  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label
          htmlFor={id}
          className="block font-heading text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        aria-invalid={erro ? "true" : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={cn(
          "mt-2 w-full border-0 border-b bg-transparent px-0 py-2 text-base text-foreground transition-colors placeholder:text-muted-foreground/60 focus:outline-none",
          erro
            ? "border-b-destructive"
            : "border-b-border focus:border-b-2 focus:border-b-primary",
          inputClassName
        )}
        {...props}
      />
      {erro ? (
        <p id={`${id}-erro`} className="mt-2 text-xs text-destructive">
          {erro}
        </p>
      ) : ajuda ? (
        <p className="mt-2 text-xs text-muted-foreground">{ajuda}</p>
      ) : null}
    </div>
  );
}