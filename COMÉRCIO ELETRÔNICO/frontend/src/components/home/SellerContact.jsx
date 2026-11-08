import { Clock, Mail, MapPin, Phone } from "lucide-react";
import Container from "@/components/common/Container";

export default function SellerContact({ loja }) {
  const contactos = [
    { Icone: MapPin, etiqueta: "Morada", valor: loja.morada, extra: loja.referencia_localizacao },
    {
      Icone: Phone,
      etiqueta: "Telefone",
      valor: loja.telefone,
      href: loja.telefone ? `tel:${loja.telefone.replace(/\s+/g, "")}` : null,
    },
    {
      Icone: Mail,
      etiqueta: "E-mail",
      valor: loja.email,
      href: loja.email ? `mailto:${loja.email}` : null,
    },
    { Icone: Clock, etiqueta: "Horário de atendimento", valor: loja.horario_atendimento },
  ].filter((contacto) => contacto.valor);

  return (
    <section id="contacto" className="scroll-mt-24 border-t border-border py-16 lg:py-20">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="font-heading text-[0.68rem] uppercase tracking-[0.2em] text-primary">
            Vendedor
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
            {loja.nome_marca}
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            {loja.sobre}
          </p>
        </div>

        <dl className="grid gap-8 sm:grid-cols-2">
          {contactos.map(({ Icone, etiqueta, valor, href, extra }) => (
            <div key={etiqueta}>
              <dt className="flex items-center gap-2 font-heading text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                <Icone className="h-4 w-4 text-primary" aria-hidden="true" />
                {etiqueta}
              </dt>
              <dd className="mt-2 text-sm text-foreground">
                {href ? (
                  <a href={href} className="break-all transition-colors hover:text-primary">
                    {valor}
                  </a>
                ) : (
                  valor
                )}
                {extra && (
                  <span className="mt-1 block text-xs text-muted-foreground">{extra}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}