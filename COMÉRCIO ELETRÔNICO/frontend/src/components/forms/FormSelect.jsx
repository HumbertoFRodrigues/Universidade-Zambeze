import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FormSelect({ id, label, opcoes = [], className, ...props }) {
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
      <div className="relative">
        <select
          id={id}
          className="mt-2 w-full appearance-none border-0 border-b border-border bg-transparent px-0 py-2 pr-8 text-sm text-foreground transition-colors focus:border-b-2 focus:border-b-primary focus:outline-none"
          {...props}
        >
          {opcoes.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.etiqueta}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-1 top-1/2 mt-1 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}