-- CreateEnum
CREATE TYPE "estado_cotacao" AS ENUM ('PEDIDA', 'RESPONDIDA', 'ACEITE', 'RECUSADA', 'EXPIRADA');

-- CreateTable
CREATE TABLE "desconto_grupo" (
    "id" SERIAL NOT NULL,
    "grupo" "tipo_cliente_empresa" NOT NULL,
    "categoria_id" INTEGER,
    "percentagem" DECIMAL(5,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "desconto_grupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotacao" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "empresa_id" INTEGER NOT NULL,
    "utilizador_id" INTEGER NOT NULL,
    "estado" "estado_cotacao" NOT NULL DEFAULT 'PEDIDA',
    "notas_cliente" TEXT,
    "notas_loja" TEXT,
    "valida_ate" TIMESTAMPTZ(6),
    "respondida_por" INTEGER,
    "respondida_em" TIMESTAMPTZ(6),
    "decidida_em" TIMESTAMPTZ(6),
    "encomenda_id" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cotacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_cotacao" (
    "id" SERIAL NOT NULL,
    "cotacao_id" INTEGER NOT NULL,
    "produto_id" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_pedido" DECIMAL(12,2),
    "preco_proposto" DECIMAL(12,2),

    CONSTRAINT "item_cotacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "desconto_grupo_categoria_id_idx" ON "desconto_grupo"("categoria_id");

-- CreateIndex
CREATE UNIQUE INDEX "desconto_grupo_grupo_categoria_id_key" ON "desconto_grupo"("grupo", "categoria_id");

-- CreateIndex
CREATE UNIQUE INDEX "cotacao_codigo_key" ON "cotacao"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "cotacao_encomenda_id_key" ON "cotacao"("encomenda_id");

-- CreateIndex
CREATE INDEX "cotacao_empresa_id_estado_idx" ON "cotacao"("empresa_id", "estado");

-- CreateIndex
CREATE INDEX "cotacao_estado_criado_em_idx" ON "cotacao"("estado", "criado_em");

-- CreateIndex
CREATE INDEX "cotacao_utilizador_id_idx" ON "cotacao"("utilizador_id");

-- CreateIndex
CREATE INDEX "cotacao_respondida_por_idx" ON "cotacao"("respondida_por");

-- CreateIndex
CREATE INDEX "item_cotacao_produto_id_idx" ON "item_cotacao"("produto_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_cotacao_cotacao_id_produto_id_key" ON "item_cotacao"("cotacao_id", "produto_id");

-- AddForeignKey
ALTER TABLE "desconto_grupo" ADD CONSTRAINT "desconto_grupo_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotacao" ADD CONSTRAINT "cotacao_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotacao" ADD CONSTRAINT "cotacao_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotacao" ADD CONSTRAINT "cotacao_respondida_por_fkey" FOREIGN KEY ("respondida_por") REFERENCES "utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotacao" ADD CONSTRAINT "cotacao_encomenda_id_fkey" FOREIGN KEY ("encomenda_id") REFERENCES "encomenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_cotacao" ADD CONSTRAINT "item_cotacao_cotacao_id_fkey" FOREIGN KEY ("cotacao_id") REFERENCES "cotacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_cotacao" ADD CONSTRAINT "item_cotacao_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Desconto de grupo: percentagem entre 0 e 100 (exclusivos) e um único desconto geral
-- (sem categoria) por grupo; o índice único acima não cobre categoria_id nula.
ALTER TABLE "desconto_grupo" ADD CONSTRAINT "desconto_grupo_percentagem_valida"
  CHECK ("percentagem" > 0 AND "percentagem" < 100);
CREATE UNIQUE INDEX "desconto_grupo_geral_unico" ON "desconto_grupo" ("grupo") WHERE "categoria_id" IS NULL;

-- Itens da cotação: quantidade positiva; preços pedido/proposto positivos quando existem.
ALTER TABLE "item_cotacao"
  ADD CONSTRAINT "item_cotacao_quantidade_positiva" CHECK ("quantidade" > 0),
  ADD CONSTRAINT "item_cotacao_preco_pedido_positivo" CHECK ("preco_pedido" IS NULL OR "preco_pedido" > 0),
  ADD CONSTRAINT "item_cotacao_preco_proposto_positivo" CHECK ("preco_proposto" IS NULL OR "preco_proposto" > 0);

-- Uma cotação respondida (ou decidida depois da resposta) tem sempre validade e data de resposta;
-- só uma cotação aceite pode ter encomenda.
ALTER TABLE "cotacao"
  ADD CONSTRAINT "cotacao_resposta_completa" CHECK (
    "estado" = 'PEDIDA' OR "estado" = 'RECUSADA' AND "respondida_em" IS NULL
    OR ("valida_ate" IS NOT NULL AND "respondida_em" IS NOT NULL)
  ),
  ADD CONSTRAINT "cotacao_encomenda_so_se_aceite" CHECK ("encomenda_id" IS NULL OR "estado" = 'ACEITE');
