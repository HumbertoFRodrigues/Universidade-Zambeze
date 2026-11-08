import { BadgeCheck, Headphones, PackageCheck } from "lucide-react";
import Container from "@/components/common/Container";

const ITENS = [
  {
    Icone: BadgeCheck,
    titulo: "Marcas reconhecidas",
    texto: "Produtos de vários fabricantes para construção, indústria, logística e emergência.",
  },
  {
    Icone: PackageCheck,
    titulo: "Disponibilidade actualizada",
    texto: "Cada produto indica se está em stock, com stock limitado ou esgotado, sem expor a quantidade exacta.",
  },
  {
    Icone: Headphones,
    titulo: "Apoio directo",
    texto: "Telefone e e-mail disponíveis para dúvidas, assistência pós-venda e reclamações.",
  },
];

export default function TrustStrip() {
  return (
    <section className="border-b border-border bg-muted/50">
      <Container className="grid gap-10 py-14 md:grid-cols-3">
        {ITENS.map(({ Icone, titulo, texto }) => (
          <div key={titulo} className="flex gap-4">
            <Icone className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-heading text-sm font-semibold tracking-tight text-foreground">
                {titulo}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{texto}</p>
            </div>
          </div>
        ))}
      </Container>
    </section>
  );
}