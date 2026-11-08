-- Comprovativo da transferência bancária (ficheiro privado, só visível ao administrador).
ALTER TABLE "pagamento" ADD COLUMN "comprovativo_url" VARCHAR(255);
