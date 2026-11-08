import { useState } from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

export default function ProductGallery({ produto }) {
  const imagens = Array.from(
    new Set([produto.imagem_principal, ...(produto.imagens || [])].filter(Boolean))
  );
  const [seleccionada, setSeleccionada] = useState(imagens[0] || "");
  const activa = imagens.includes(seleccionada) ? seleccionada : imagens[0] || "";
  const posicao = imagens.indexOf(activa) + 1;

  return (
    <div>
      <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-muted">
        <Image
          src={activa}
          alt={`${produto.nome} — imagem ${posicao} de ${imagens.length || 1}`}
          className="aspect-square w-full object-cover"
        />
      </div>

      {imagens.length > 1 && (
        <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
          {imagens.map((imagem, indice) => (
            <button
              key={`${imagem}-${indice}`}
              type="button"
              onClick={() => setSeleccionada(imagem)}
              aria-pressed={activa === imagem}
              aria-label={`Ver imagem ${indice + 1} de ${imagens.length}`}
              className={cn(
                "overflow-hidden rounded-[var(--radius)] border transition-colors",
                activa === imagem ? "border-primary" : "border-border hover:border-primary/60"
              )}
            >
              <Image src={imagem} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {produto.imagens?.length === 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          Imagens adicionais deste produto serão publicadas em breve.
        </p>
      )}
    </div>
  );
}