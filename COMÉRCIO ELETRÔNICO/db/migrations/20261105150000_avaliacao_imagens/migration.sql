-- Fotografias enviadas pelo comprador com a avaliação (até 4).
ALTER TABLE "avaliacao_produto" ADD COLUMN "imagens" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
