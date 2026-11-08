-- Renomeacao controlada: preserva os registos e todos os IDs/FKs existentes.
BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "products" WHERE length("name") > 200) THEN
    RAISE EXCEPTION 'Existem nomes de produto com mais de 200 caracteres. Corrigir antes de aplicar esta migration.';
  END IF;
END;
$$;

ALTER TABLE "products" RENAME TO "produto";
ALTER TABLE "produto" RENAME COLUMN "name" TO "nome";
ALTER TABLE "produto" RENAME COLUMN "description" TO "descricao";
ALTER TABLE "produto" RENAME COLUMN "price" TO "preco";
ALTER TABLE "produto" RENAME COLUMN "currency" TO "codigo_moeda";
ALTER TABLE "produto" RENAME COLUMN "stock" TO "quantidade_stock";
ALTER TABLE "produto" RENAME COLUMN "createdAt" TO "criado_em";
ALTER TABLE "produto" RENAME COLUMN "updatedAt" TO "actualizado_em";

-- Os timestamps anteriores do Prisma representam instantes UTC.
ALTER TABLE "produto"
  ALTER COLUMN "nome" TYPE VARCHAR(200),
  ALTER COLUMN "criado_em" TYPE TIMESTAMPTZ(6) USING "criado_em" AT TIME ZONE 'UTC',
  ALTER COLUMN "actualizado_em" TYPE TIMESTAMPTZ(6) USING "actualizado_em" AT TIME ZONE 'UTC',
  ALTER COLUMN "actualizado_em" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "produto" RENAME CONSTRAINT "products_pkey" TO "produto_pkey";
ALTER TABLE "produto" RENAME CONSTRAINT "products_categoria_id_fkey" TO "produto_categoria_id_fkey";
ALTER TABLE "produto" RENAME CONSTRAINT "products_preco_positivo" TO "produto_preco_positivo";
ALTER TABLE "produto" RENAME CONSTRAINT "products_stock_nao_negativo" TO "produto_stock_nao_negativo";
ALTER TABLE "produto" RENAME CONSTRAINT "products_limiar_nao_negativo" TO "produto_limiar_nao_negativo";
ALTER INDEX "products_slug_key" RENAME TO "produto_slug_key";
ALTER INDEX "products_codigo_key" RENAME TO "produto_codigo_key";
ALTER INDEX "products_categoria_id_idx" RENAME TO "produto_categoria_id_idx";

COMMIT;
