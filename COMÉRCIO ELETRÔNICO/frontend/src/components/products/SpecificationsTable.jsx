export default function SpecificationsTable({ especificacoes = [] }) {
  if (especificacoes.length === 0) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        Especificações técnicas detalhadas a confirmar com o vendedor.
      </p>
    );
  }

  return (
    <dl className="mt-5 divide-y divide-border border-y border-border">
      {especificacoes.map((item, indice) => (
        <div
          key={`${item.nome}-${indice}`}
          className="grid gap-1 py-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:gap-8"
        >
          <dt className="font-heading text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground">
            {item.nome}
          </dt>
          <dd className="text-sm text-foreground">{item.valor}</dd>
        </div>
      ))}
    </dl>
  );
}