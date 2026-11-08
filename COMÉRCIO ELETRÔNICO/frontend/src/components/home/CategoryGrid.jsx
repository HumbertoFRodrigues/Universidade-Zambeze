import { Anchor, Flame, Footprints, Glasses, Hand, HardHat, Shirt, Wind } from "lucide-react";
import Container from "@/components/common/Container";
import SectionHeading from "@/components/common/SectionHeading";
import { cn } from "@/lib/utils";

const ICONES = {
  cabeca: HardHat,
  ocular: Glasses,
  respiratoria: Wind,
  maos: Hand,
  pes: Footprints,
  visibilidade: Shirt,
  altura: Anchor,
  emergencia: Flame,
};

export default function CategoryGrid({ categorias, contagens, seleccionada, onSelecionar, carregando }) {
  return (
    <section id="categorias" className="scroll-mt-24 border-b border-border py-16 lg:py-20">
      <Container>
        <SectionHeading
          eyebrow="Catálogo"
          titulo="Categorias de protecção"
          descricao="Navegue por tipo de risco e filtre de imediato os produtos que interessam."
        />

        <div className="mt-12">
          {carregando ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4" aria-hidden="true">
              {Array.from({ length: 8 }).map((_, indice) => (
                <div key={indice} className="h-40 animate-pulse rounded-[var(--radius)] bg-muted" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] border border-border bg-border md:grid-cols-3 lg:grid-cols-4">
              {categorias.map((categoria) => {
                const Icone = ICONES[categoria.icone] || HardHat;
                const activa = seleccionada === categoria.nome;

                return (
                  <button
                    key={categoria.id}
                    type="button"
                    onClick={() => onSelecionar(categoria.nome)}
                    aria-pressed={activa}
                    className={cn(
                      "flex min-h-[168px] flex-col items-start gap-4 p-6 text-left transition-colors",
                      activa ? "bg-primary/5" : "bg-background hover:bg-muted"
                    )}
                  >
                    <Icone
                      className={cn("h-6 w-6", activa ? "text-primary" : "text-foreground")}
                      aria-hidden="true"
                    />
                    <span className="font-heading text-sm font-semibold leading-snug tracking-tight text-foreground">
                      {categoria.nome}
                    </span>
                    <span className="mt-auto text-xs text-muted-foreground">
                      {contagens?.[categoria.nome] ?? 0} produtos
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}