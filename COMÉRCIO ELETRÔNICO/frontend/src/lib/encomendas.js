export const ESTADOS = {
  pendente: { label: "Pendente", classe: "bg-amber-500/10 text-amber-600" },
  confirmada: { label: "Confirmada", classe: "bg-sky-500/10 text-sky-600" },
  em_preparacao: { label: "Em preparação", classe: "bg-indigo-500/10 text-indigo-600" },
  enviada: { label: "Enviada", classe: "bg-cyan-500/10 text-cyan-600" },
  entregue: { label: "Entregue", classe: "bg-emerald-500/10 text-emerald-600" },
  cancelada: { label: "Cancelada", classe: "bg-destructive/10 text-destructive" },
};

export const PAGAMENTOS = {
  pendente: { label: "Pendente", classe: "bg-amber-500/10 text-amber-600" },
  pago: { label: "Pago", classe: "bg-emerald-500/10 text-emerald-600" },
  recusado: { label: "Recusado", classe: "bg-destructive/10 text-destructive" },
  reembolsado: { label: "Reembolsado", classe: "bg-muted text-muted-foreground" },
};

export const ENTREGAS = {
  por_preparar: { label: "Por preparar", classe: "bg-amber-500/10 text-amber-600" },
  em_transito: { label: "Em trânsito", classe: "bg-cyan-500/10 text-cyan-600" },
  entregue: { label: "Entregue", classe: "bg-emerald-500/10 text-emerald-600" },
  sem_entrega: { label: "Sem entrega", classe: "bg-muted text-muted-foreground" },
};

export const ESTADOS_LISTA = Object.entries(ESTADOS).map(([valor, { label }]) => ({
  valor,
  label,
}));

export const PAGAMENTOS_LISTA = Object.entries(PAGAMENTOS).map(([valor, { label }]) => ({
  valor,
  label,
}));

export const ENTREGAS_LISTA = Object.entries(ENTREGAS).map(([valor, { label }]) => ({
  valor,
  label,
}));

export const METODOS_PAGAMENTO = [
  "Transferência bancária",
  "M-Pesa",
  "Cartão",
  "Numerário na entrega",
];