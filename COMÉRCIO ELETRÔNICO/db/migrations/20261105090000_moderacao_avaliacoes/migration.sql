-- Moderação das avaliações de produtos: novas avaliações ficam PENDENTE até o administrador decidir.
CREATE TYPE "estado_avaliacao" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA');

ALTER TABLE "avaliacao_produto"
  ADD COLUMN "estado" "estado_avaliacao" NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN "motivo_rejeicao" VARCHAR(255),
  ADD COLUMN "moderado_em" TIMESTAMPTZ(6);

-- As avaliações anteriores à moderação continuam visíveis.
UPDATE "avaliacao_produto" SET "estado" = 'APROVADA', "moderado_em" = "criado_em";

CREATE INDEX "avaliacao_produto_estado_idx" ON "avaliacao_produto"("estado");
