-- NUIT moçambicano: exactamente 9 dígitos.
ALTER TABLE "empresa" ADD CONSTRAINT "empresa_nuit_valido" CHECK ("nuit" ~ '^[0-9]{9}$');

-- Uma decisão (aprovação ou suspensão) fica sempre datada.
ALTER TABLE "empresa" ADD CONSTRAINT "empresa_decisao_datada"
  CHECK ("estado" = 'PENDENTE' OR "decidido_em" IS NOT NULL);
