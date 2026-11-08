-- AlterTable
ALTER TABLE "configuracao_loja" ADD COLUMN     "nuit" VARCHAR(9),
ADD COLUMN     "taxa_iva" DECIMAL(5,2) NOT NULL DEFAULT 16;

-- AlterTable
ALTER TABLE "encomenda" ADD COLUMN     "base_tributavel" DECIMAL(12,2),
ADD COLUMN     "facturacao_morada" VARCHAR(500),
ADD COLUMN     "facturacao_nome" VARCHAR(200),
ADD COLUMN     "facturacao_nuit" VARCHAR(9),
ADD COLUMN     "taxa_iva" DECIMAL(5,2),
ADD COLUMN     "valor_iva" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "serie_factura" (
    "ano" INTEGER NOT NULL,
    "ultimo_numero" INTEGER NOT NULL,

    CONSTRAINT "serie_factura_pkey" PRIMARY KEY ("ano")
);

-- CreateTable
CREATE TABLE "factura" (
    "id" SERIAL NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "ano" INTEGER NOT NULL,
    "sequencia" INTEGER NOT NULL,
    "encomenda_id" INTEGER NOT NULL,
    "emitida_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendedor_nome" VARCHAR(200) NOT NULL,
    "vendedor_nuit" VARCHAR(9),
    "vendedor_morada" VARCHAR(255),
    "cliente_nome" VARCHAR(200) NOT NULL,
    "cliente_nuit" VARCHAR(9),
    "cliente_morada" VARCHAR(500) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "total_desconto" DECIMAL(12,2) NOT NULL,
    "valor_frete" DECIMAL(12,2) NOT NULL,
    "base_tributavel" DECIMAL(12,2) NOT NULL,
    "taxa_iva" DECIMAL(5,2) NOT NULL,
    "valor_iva" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "codigo_moeda" CHAR(3) NOT NULL DEFAULT 'MZN',

    CONSTRAINT "factura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "factura_numero_key" ON "factura"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "factura_encomenda_id_key" ON "factura"("encomenda_id");

-- CreateIndex
CREATE INDEX "factura_emitida_em_idx" ON "factura"("emitida_em");

-- CreateIndex
CREATE UNIQUE INDEX "factura_ano_sequencia_key" ON "factura"("ano", "sequencia");

-- AddForeignKey
ALTER TABLE "factura" ADD CONSTRAINT "factura_encomenda_id_fkey" FOREIGN KEY ("encomenda_id") REFERENCES "encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Integridade fiscal (modelo por validar por contabilista).
ALTER TABLE "configuracao_loja"
  ADD CONSTRAINT "configuracao_taxa_iva_valida" CHECK ("taxa_iva" >= 0 AND "taxa_iva" < 100),
  ADD CONSTRAINT "configuracao_nuit_valido" CHECK ("nuit" IS NULL OR "nuit" ~ '^[0-9]{9}$');
ALTER TABLE "encomenda"
  ADD CONSTRAINT "encomenda_iva_coerente" CHECK (
    "valor_iva" IS NULL OR ("base_tributavel" + "valor_iva" = "valor_total" AND "valor_iva" >= 0)
  ),
  ADD CONSTRAINT "encomenda_facturacao_nuit_valido" CHECK ("facturacao_nuit" IS NULL OR "facturacao_nuit" ~ '^[0-9]{9}$');
ALTER TABLE "serie_factura"
  ADD CONSTRAINT "serie_factura_valida" CHECK ("ano" BETWEEN 2000 AND 9999 AND "ultimo_numero" >= 1);
ALTER TABLE "factura"
  ADD CONSTRAINT "factura_sequencia_positiva" CHECK ("sequencia" >= 1),
  ADD CONSTRAINT "factura_numero_coerente" CHECK ("numero" = 'FT ' || "ano" || '/' || lpad("sequencia"::text, 4, '0')),
  ADD CONSTRAINT "factura_totais_coerentes" CHECK (
    "total" = "subtotal" - "total_desconto" + "valor_frete" AND "base_tributavel" + "valor_iva" = "total" AND "valor_iva" >= 0
  ),
  ADD CONSTRAINT "factura_nuits_validos" CHECK (
    ("vendedor_nuit" IS NULL OR "vendedor_nuit" ~ '^[0-9]{9}$') AND ("cliente_nuit" IS NULL OR "cliente_nuit" ~ '^[0-9]{9}$')
  );
