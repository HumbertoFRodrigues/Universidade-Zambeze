import { LifeBuoy, PackageCheck } from "lucide-react";
import { estadoStock } from "@/lib/format";

const TEXTOS = {
  disponivel: "Disponível para envio a partir do armazém. A quantidade exacta é confirmada no momento da encomenda.",
  limitado: "Stock reduzido. Recomendamos confirmar a quantidade antes de encomendar volumes maiores.",
  esgotado: "Sem stock neste momento. O produto continua no catálogo para consulta, mas sem opção de compra.",
};

export default function ProductAssurance({ produto, loja }) {
  const { chave, etiqueta } = estadoStock(produto);

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius)] border border-border p-6">
        <p className="flex items-center gap-2 font-heading text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground">
          <PackageCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          Disponibilidade
        </p>
        <p className="mt-3 font-heading text-sm font-semibold tracking-tight text-foreground">
          {etiqueta}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{TEXTOS[chave]}</p>
        {chave === "esgotado" && loja?.email && (
          <a
            href={`mailto:${loja.email}?subject=${encodeURIComponent(`Reposição: ${produto.nome}`)}`}
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            Pedir informação de reposição
          </a>
        )}
      </div>

      <div className="rounded-[var(--radius)] border border-border p-6">
        <p className="flex items-center gap-2 font-heading text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground">
          <LifeBuoy className="h-4 w-4 text-primary" aria-hidden="true" />
          Garantia
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {produto.garantia || "Condições de garantia a confirmar com o vendedor."}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Apoio pós-venda e assistência através dos contactos do vendedor.
        </p>
      </div>
    </div>
  );
}