import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const ESTRELAS = [1, 2, 3, 4, 5];

export default function StarRating({ valor = 0, onChange, tamanho = "normal", className }) {
  const dimensao = tamanho === "grande" ? "h-6 w-6" : "h-4 w-4";

  if (!onChange) {
    return (
      <span
        className={cn("inline-flex items-center gap-0.5", className)}
        aria-label={`${valor > 0 ? valor.toFixed(1) : 0} de 5 estrelas`}
      >
        {ESTRELAS.map((numero) => (
          <Star
            key={numero}
            className={cn(
              dimensao,
              numero <= Math.round(valor) ? "fill-primary text-primary" : "text-border"
            )}
            aria-hidden="true"
          />
        ))}
      </span>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Classificação de 1 a 5 estrelas"
      className={cn("inline-flex items-center gap-1", className)}
    >
      {ESTRELAS.map((numero) => (
        <button
          key={numero}
          type="button"
          role="radio"
          aria-checked={valor === numero}
          aria-label={`${numero} ${numero === 1 ? "estrela" : "estrelas"}`}
          onClick={() => onChange(numero)}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={cn(dimensao, numero <= valor ? "fill-primary text-primary" : "text-border")}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}