-- CreateEnum
CREATE TYPE "tipo_cliente_empresa" AS ENUM ('EMPRESA', 'REVENDEDOR');

-- CreateEnum
CREATE TYPE "estado_empresa" AS ENUM ('PENDENTE', 'APROVADA', 'SUSPENSA');

-- AlterEnum
ALTER TYPE "perfil_utilizador" ADD VALUE 'EMPRESA';

-- CreateTable
CREATE TABLE "empresa" (
    "id" SERIAL NOT NULL,
    "utilizador_id" INTEGER NOT NULL,
    "nome" VARCHAR(200) NOT NULL,
    "nuit" VARCHAR(9) NOT NULL,
    "rua" VARCHAR(255) NOT NULL,
    "bairro" VARCHAR(100) NOT NULL,
    "cidade" VARCHAR(100) NOT NULL,
    "provincia" VARCHAR(100) NOT NULL,
    "telefone" VARCHAR(30) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "tipo_cliente" "tipo_cliente_empresa" NOT NULL,
    "estado" "estado_empresa" NOT NULL DEFAULT 'PENDENTE',
    "motivo_estado" VARCHAR(500),
    "decidido_por" INTEGER,
    "decidido_em" TIMESTAMPTZ(6),
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresa_utilizador_id_key" ON "empresa"("utilizador_id");

-- CreateIndex
CREATE UNIQUE INDEX "empresa_nuit_key" ON "empresa"("nuit");

-- CreateIndex
CREATE INDEX "empresa_estado_idx" ON "empresa"("estado");

-- CreateIndex
CREATE INDEX "empresa_decidido_por_idx" ON "empresa"("decidido_por");

-- AddForeignKey
ALTER TABLE "empresa" ADD CONSTRAINT "empresa_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empresa" ADD CONSTRAINT "empresa_decidido_por_fkey" FOREIGN KEY ("decidido_por") REFERENCES "utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;
