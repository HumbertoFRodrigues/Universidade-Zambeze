export const ESTADOS_DEVOLUCAO = {
  pendente: { label: "Pendente", classe: "bg-amber-500/10 text-amber-600" },
  aprovada: { label: "Aprovada", classe: "bg-sky-500/10 text-sky-600" },
  recusada: { label: "Recusada", classe: "bg-destructive/10 text-destructive" },
  em_processamento: { label: "Em processamento", classe: "bg-indigo-500/10 text-indigo-600" },
  concluida: { label: "Concluída", classe: "bg-emerald-500/10 text-emerald-600" },
  cancelada: { label: "Cancelada", classe: "bg-muted text-muted-foreground" },
};

export const ESTADOS_REEMBOLSO = {
  pendente: { label: "Pendente", classe: "bg-amber-500/10 text-amber-600" },
  aprovado: { label: "Aprovado", classe: "bg-sky-500/10 text-sky-600" },
  processado: { label: "Processado", classe: "bg-emerald-500/10 text-emerald-600" },
  recusado: { label: "Recusado", classe: "bg-destructive/10 text-destructive" },
};

export const ESTADOS_DEVOLUCAO_LISTA = Object.entries(ESTADOS_DEVOLUCAO).map(([valor, { label }]) => ({
  valor,
  label,
}));

export const ESTADOS_REEMBOLSO_LISTA = Object.entries(ESTADOS_REEMBOLSO).map(([valor, { label }]) => ({
  valor,
  label,
}));

export const MOTIVOS_DEVOLUCAO = [
  "Produto defeituoso",
  "Produto incorrecto",
  "Não corresponde à descrição",
  "Chegou danificado no transporte",
  "Arrependimento / mudança de ideia",
  "Outro",
];

export const METODOS_REEMBOLSO = [
  "Transferência bancária",
  "M-Pesa",
  "Cartão",
  "Crédito na loja",
];