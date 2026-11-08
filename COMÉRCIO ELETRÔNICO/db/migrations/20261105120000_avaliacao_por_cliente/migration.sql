-- Avaliações ligadas ao produto e ao cliente: qualquer cliente com conta pode avaliar.
-- A ligação ao item de encomenda passa a opcional e indica "compra verificada".
ALTER TABLE "avaliacao_produto"
  ADD COLUMN "produto_id" TEXT,
  ADD COLUMN "utilizador_id" INTEGER;

UPDATE "avaliacao_produto" AS ap
SET "produto_id" = ie."produto_id", "utilizador_id" = e."utilizador_id"
FROM "item_encomenda" AS ie
JOIN "encomenda" AS e ON e."id" = ie."encomenda_id"
WHERE ie."id" = ap."item_encomenda_id";

ALTER TABLE "avaliacao_produto"
  ALTER COLUMN "produto_id" SET NOT NULL,
  ALTER COLUMN "item_encomenda_id" DROP NOT NULL;

ALTER TABLE "avaliacao_produto"
  ADD CONSTRAINT "avaliacao_produto_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "avaliacao_produto_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "avaliacao_produto_produto_id_idx" ON "avaliacao_produto"("produto_id");
CREATE INDEX "avaliacao_produto_utilizador_id_produto_id_idx" ON "avaliacao_produto"("utilizador_id", "produto_id");
