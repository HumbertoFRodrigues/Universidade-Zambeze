BEGIN;

-- CreateEnum
CREATE TYPE "perfil_utilizador" AS ENUM ('CLIENTE', 'ADMINISTRADOR');

-- CreateEnum
CREATE TYPE "estado_encomenda" AS ENUM ('REGISTADA', 'EM_PROCESSAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "estado_pagamento" AS ENUM ('PENDENTE', 'CONFIRMADO', 'FALHADO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "estado_entrega" AS ENUM ('POR_EXPEDIR', 'EM_TRANSPORTE', 'ENTREGUE', 'NAO_ENTREGUE');

-- CreateEnum
CREATE TYPE "estado_devolucao" AS ENUM ('SOLICITADA', 'EM_ANALISE', 'APROVADA', 'REJEITADA', 'PRODUTO_RECEBIDO', 'REEMBOLSADA');

-- CreateEnum
CREATE TYPE "estado_reembolso" AS ENUM ('PENDENTE', 'CONCLUIDO', 'FALHADO');

-- CreateEnum
CREATE TYPE "tipo_desconto" AS ENUM ('PERCENTAGEM', 'FIXO');

-- CreateEnum
CREATE TYPE "tipo_movimento" AS ENUM ('ENTRADA', 'AJUSTE', 'VENDA', 'REPOSICAO_CANCELAMENTO', 'REPOSICAO_DEVOLUCAO');

-- CreateEnum
CREATE TYPE "motivo_devolucao" AS ENUM ('ARREPENDIMENTO', 'DIFERENTE_DA_DESCRICAO', 'DEFEITUOSO', 'OUTRO');

-- CreateEnum
CREATE TYPE "condicao_item" AS ENUM ('PENDENTE', 'REVENDAVEL', 'NAO_REVENDAVEL');

-- CreateEnum
CREATE TYPE "tipo_pedido" AS ENUM ('DUVIDA', 'GARANTIA', 'RECLAMACAO');

-- CreateEnum
CREATE TYPE "estado_pedido" AS ENUM ('ABERTO', 'EM_CURSO', 'RESOLVIDO', 'FECHADO');

-- CreateEnum
CREATE TYPE "tipo_politica" AS ENUM ('PRIVACIDADE', 'TERMOS', 'ENTREGA', 'DEVOLUCAO', 'GARANTIA');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "categoria_id" INTEGER,
ADD COLUMN     "codigo" VARCHAR(50),
ADD COLUMN     "especificacoes" JSONB,
ADD COLUMN     "garantia" TEXT,
ADD COLUMN     "limiar_stock_baixo" INTEGER,
ADD COLUMN     "marca" VARCHAR(100);

-- CreateTable
CREATE TABLE "categoria" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "categoria_pai_id" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imagem_produto" (
    "id" SERIAL NOT NULL,
    "produto_id" TEXT NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "texto_alternativo" VARCHAR(200),
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "principal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "imagem_produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utilizador" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "telefone" VARCHAR(30) NOT NULL,
    "hash_palavra_passe" VARCHAR(255) NOT NULL,
    "perfil" "perfil_utilizador" NOT NULL DEFAULT 'CLIENTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "privacidade_aceite_em" TIMESTAMPTZ(6) NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilizador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endereco" (
    "id" SERIAL NOT NULL,
    "utilizador_id" INTEGER NOT NULL,
    "etiqueta" VARCHAR(50),
    "nome_destinatario" VARCHAR(150) NOT NULL,
    "telefone" VARCHAR(30) NOT NULL,
    "linha_endereco" VARCHAR(255) NOT NULL,
    "cidade" VARCHAR(100) NOT NULL,
    "provincia" VARCHAR(100) NOT NULL,
    "ponto_referencia" VARCHAR(255),
    "zona_entrega_id" INTEGER NOT NULL,
    "predefinido" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "endereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_recuperacao" (
    "id" SERIAL NOT NULL,
    "utilizador_id" INTEGER NOT NULL,
    "hash_token" VARCHAR(255) NOT NULL,
    "expira_em" TIMESTAMPTZ(6) NOT NULL,
    "usado_em" TIMESTAMPTZ(6),
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "token_recuperacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carrinho" (
    "id" SERIAL NOT NULL,
    "utilizador_id" INTEGER,
    "token_sessao" VARCHAR(64),
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carrinho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_carrinho" (
    "id" SERIAL NOT NULL,
    "carrinho_id" INTEGER NOT NULL,
    "produto_id" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "item_carrinho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encomenda" (
    "id" SERIAL NOT NULL,
    "codigo_encomenda" VARCHAR(20) NOT NULL,
    "chave_idempotencia" VARCHAR(64) NOT NULL,
    "utilizador_id" INTEGER,
    "estado" "estado_encomenda" NOT NULL DEFAULT 'REGISTADA',
    "nome_contacto" VARCHAR(150) NOT NULL,
    "email_contacto" VARCHAR(254) NOT NULL,
    "telefone_contacto" VARCHAR(30) NOT NULL,
    "entrega_nome_destinatario" VARCHAR(150) NOT NULL,
    "entrega_telefone" VARCHAR(30) NOT NULL,
    "entrega_linha_endereco" VARCHAR(255) NOT NULL,
    "entrega_cidade" VARCHAR(100) NOT NULL,
    "entrega_provincia" VARCHAR(100) NOT NULL,
    "entrega_ponto_referencia" VARCHAR(255),
    "zona_entrega_id" INTEGER NOT NULL,
    "modalidade_entrega_id" INTEGER NOT NULL,
    "valor_subtotal" DECIMAL(12,2) NOT NULL,
    "total_desconto" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "valor_frete" DECIMAL(12,2) NOT NULL,
    "valor_total" DECIMAL(12,2) NOT NULL,
    "termos_aceites_em" TIMESTAMPTZ(6) NOT NULL,
    "versao_termos" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encomenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_encomenda" (
    "id" SERIAL NOT NULL,
    "encomenda_id" INTEGER NOT NULL,
    "produto_id" TEXT NOT NULL,
    "nome_produto" VARCHAR(200) NOT NULL,
    "codigo_produto" VARCHAR(50) NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "preco_unitario" DECIMAL(12,2) NOT NULL,
    "desconto_unitario" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "promocao_id" INTEGER,
    "nome_promocao" VARCHAR(150),
    "quantidade_devolvida" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "item_encomenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_estado_encomenda" (
    "id" SERIAL NOT NULL,
    "encomenda_id" INTEGER NOT NULL,
    "estado_anterior" "estado_encomenda",
    "estado_novo" "estado_encomenda" NOT NULL,
    "alterado_por" INTEGER,
    "observacao" VARCHAR(255),
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_estado_encomenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forma_pagamento" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "simulado" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "forma_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamento" (
    "id" SERIAL NOT NULL,
    "encomenda_id" INTEGER NOT NULL,
    "forma_pagamento_id" INTEGER NOT NULL,
    "referencia_operacao" VARCHAR(64) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "valor_reembolsado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estado" "estado_pagamento" NOT NULL DEFAULT 'PENDENTE',
    "simulado" BOOLEAN NOT NULL,
    "motivo_falha" VARCHAR(255),
    "confirmado_em" TIMESTAMPTZ(6),

    CONSTRAINT "pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zona_entrega" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "zona_entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modalidade_entrega" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "levantamento_loja" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "modalidade_entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarifa_frete" (
    "zona_entrega_id" INTEGER NOT NULL,
    "modalidade_entrega_id" INTEGER NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "prazo_dias" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tarifa_frete_pkey" PRIMARY KEY ("zona_entrega_id","modalidade_entrega_id")
);

-- CreateTable
CREATE TABLE "entrega" (
    "id" SERIAL NOT NULL,
    "encomenda_id" INTEGER NOT NULL,
    "estado" "estado_entrega" NOT NULL DEFAULT 'POR_EXPEDIR',
    "expedido_em" TIMESTAMPTZ(6),
    "entregue_em" TIMESTAMPTZ(6),
    "recebido_por" VARCHAR(150),
    "observacao" VARCHAR(255),

    CONSTRAINT "entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promocao" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "descricao" VARCHAR(255),
    "tipo_desconto" "tipo_desconto" NOT NULL,
    "valor_desconto" DECIMAL(12,2) NOT NULL,
    "inicio_em" TIMESTAMPTZ(6) NOT NULL,
    "fim_em" TIMESTAMPTZ(6) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "categoria_id" INTEGER,

    CONSTRAINT "promocao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promocao_produto" (
    "promocao_id" INTEGER NOT NULL,
    "produto_id" TEXT NOT NULL,

    CONSTRAINT "promocao_produto_pkey" PRIMARY KEY ("promocao_id","produto_id")
);

-- CreateTable
CREATE TABLE "movimento_stock" (
    "id" BIGSERIAL NOT NULL,
    "produto_id" TEXT NOT NULL,
    "tipo_movimento" "tipo_movimento" NOT NULL,
    "variacao_quantidade" INTEGER NOT NULL,
    "stock_apos" INTEGER NOT NULL,
    "item_encomenda_id" INTEGER,
    "item_devolucao_id" INTEGER,
    "motivo" VARCHAR(255),
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimento_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacao_produto" (
    "id" SERIAL NOT NULL,
    "item_encomenda_id" INTEGER NOT NULL,
    "classificacao" SMALLINT NOT NULL,
    "comentario" TEXT,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacao_produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacao_encomenda" (
    "id" SERIAL NOT NULL,
    "encomenda_id" INTEGER NOT NULL,
    "classificacao_experiencia" SMALLINT NOT NULL,
    "recomenda" BOOLEAN NOT NULL,
    "comentario" TEXT,

    CONSTRAINT "avaliacao_encomenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_assistencia" (
    "id" SERIAL NOT NULL,
    "tipo_pedido" "tipo_pedido" NOT NULL,
    "utilizador_id" INTEGER,
    "encomenda_id" INTEGER,
    "nome_contacto" VARCHAR(150) NOT NULL,
    "email_contacto" VARCHAR(254) NOT NULL,
    "telefone_contacto" VARCHAR(30),
    "assunto" VARCHAR(150) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "estado" "estado_pedido" NOT NULL DEFAULT 'ABERTO',
    "resposta" TEXT,
    "respondido_por" INTEGER,
    "respondido_em" TIMESTAMPTZ(6),

    CONSTRAINT "pedido_assistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devolucao" (
    "id" SERIAL NOT NULL,
    "codigo_devolucao" VARCHAR(20) NOT NULL,
    "encomenda_id" INTEGER NOT NULL,
    "tipo_motivo" "motivo_devolucao" NOT NULL,
    "descricao_motivo" TEXT,
    "estado" "estado_devolucao" NOT NULL DEFAULT 'SOLICITADA',
    "justificacao_decisao" VARCHAR(500),
    "decidido_por" INTEGER,
    "decidido_em" TIMESTAMPTZ(6),
    "recebido_em" TIMESTAMPTZ(6),
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devolucao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_devolucao" (
    "id" SERIAL NOT NULL,
    "devolucao_id" INTEGER NOT NULL,
    "item_encomenda_id" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "resultado_verificacao" "condicao_item" NOT NULL DEFAULT 'PENDENTE',

    CONSTRAINT "item_devolucao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reembolso" (
    "id" SERIAL NOT NULL,
    "devolucao_id" INTEGER,
    "pagamento_id" INTEGER NOT NULL,
    "referencia_operacao" VARCHAR(64) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "estado" "estado_reembolso" NOT NULL DEFAULT 'PENDENTE',
    "simulado" BOOLEAN NOT NULL,
    "processado_por" INTEGER,
    "processado_em" TIMESTAMPTZ(6),
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reembolso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracao_loja" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nome_marca" VARCHAR(150) NOT NULL,
    "designacao_legal" VARCHAR(200),
    "sobre" TEXT,
    "morada" VARCHAR(255),
    "referencia_localizacao" VARCHAR(255),
    "telefone" VARCHAR(30),
    "email" VARCHAR(254),
    "horario_atendimento" VARCHAR(255),
    "codigo_moeda" CHAR(3) NOT NULL DEFAULT 'MZN',
    "actualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracao_loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "politica_loja" (
    "id" SERIAL NOT NULL,
    "tipo_politica" "tipo_politica" NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "conteudo" TEXT NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "actualizado_por" INTEGER,
    "actualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "politica_loja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registo_auditoria" (
    "id" BIGSERIAL NOT NULL,
    "utilizador_autor_id" INTEGER,
    "accao" VARCHAR(60) NOT NULL,
    "tipo_entidade" VARCHAR(50) NOT NULL,
    "id_entidade" VARCHAR(50) NOT NULL,
    "detalhes" JSONB,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registo_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nome_key" ON "categoria"("nome");

-- CreateIndex
CREATE INDEX "categoria_categoria_pai_id_idx" ON "categoria"("categoria_pai_id");

-- CreateIndex
CREATE INDEX "imagem_produto_produto_id_idx" ON "imagem_produto"("produto_id");

-- CreateIndex
CREATE UNIQUE INDEX "utilizador_email_key" ON "utilizador"("email");

-- CreateIndex
CREATE INDEX "endereco_utilizador_id_idx" ON "endereco"("utilizador_id");

-- CreateIndex
CREATE INDEX "endereco_zona_entrega_id_idx" ON "endereco"("zona_entrega_id");

-- CreateIndex
CREATE UNIQUE INDEX "token_recuperacao_hash_token_key" ON "token_recuperacao"("hash_token");

-- CreateIndex
CREATE INDEX "token_recuperacao_utilizador_id_idx" ON "token_recuperacao"("utilizador_id");

-- CreateIndex
CREATE UNIQUE INDEX "carrinho_utilizador_id_key" ON "carrinho"("utilizador_id");

-- CreateIndex
CREATE UNIQUE INDEX "carrinho_token_sessao_key" ON "carrinho"("token_sessao");

-- CreateIndex
CREATE INDEX "item_carrinho_produto_id_idx" ON "item_carrinho"("produto_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_carrinho_carrinho_id_produto_id_key" ON "item_carrinho"("carrinho_id", "produto_id");

-- CreateIndex
CREATE UNIQUE INDEX "encomenda_codigo_encomenda_key" ON "encomenda"("codigo_encomenda");

-- CreateIndex
CREATE UNIQUE INDEX "encomenda_chave_idempotencia_key" ON "encomenda"("chave_idempotencia");

-- CreateIndex
CREATE INDEX "encomenda_utilizador_id_idx" ON "encomenda"("utilizador_id");

-- CreateIndex
CREATE INDEX "encomenda_zona_entrega_id_modalidade_entrega_id_idx" ON "encomenda"("zona_entrega_id", "modalidade_entrega_id");

-- CreateIndex
CREATE INDEX "encomenda_modalidade_entrega_id_idx" ON "encomenda"("modalidade_entrega_id");

-- CreateIndex
CREATE INDEX "encomenda_estado_criado_em_idx" ON "encomenda"("estado", "criado_em");

-- CreateIndex
CREATE INDEX "item_encomenda_produto_id_idx" ON "item_encomenda"("produto_id");

-- CreateIndex
CREATE INDEX "item_encomenda_promocao_id_idx" ON "item_encomenda"("promocao_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_encomenda_encomenda_id_produto_id_key" ON "item_encomenda"("encomenda_id", "produto_id");

-- CreateIndex
CREATE INDEX "historico_estado_encomenda_encomenda_id_criado_em_idx" ON "historico_estado_encomenda"("encomenda_id", "criado_em");

-- CreateIndex
CREATE INDEX "historico_estado_encomenda_alterado_por_idx" ON "historico_estado_encomenda"("alterado_por");

-- CreateIndex
CREATE UNIQUE INDEX "forma_pagamento_codigo_key" ON "forma_pagamento"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "pagamento_referencia_operacao_key" ON "pagamento"("referencia_operacao");

-- CreateIndex
CREATE INDEX "pagamento_encomenda_id_idx" ON "pagamento"("encomenda_id");

-- CreateIndex
CREATE INDEX "pagamento_forma_pagamento_id_idx" ON "pagamento"("forma_pagamento_id");

-- CreateIndex
CREATE UNIQUE INDEX "zona_entrega_nome_key" ON "zona_entrega"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "modalidade_entrega_nome_key" ON "modalidade_entrega"("nome");

-- CreateIndex
CREATE INDEX "tarifa_frete_modalidade_entrega_id_idx" ON "tarifa_frete"("modalidade_entrega_id");

-- CreateIndex
CREATE UNIQUE INDEX "entrega_encomenda_id_key" ON "entrega"("encomenda_id");

-- CreateIndex
CREATE INDEX "promocao_categoria_id_idx" ON "promocao"("categoria_id");

-- CreateIndex
CREATE INDEX "promocao_produto_produto_id_idx" ON "promocao_produto"("produto_id");

-- CreateIndex
CREATE INDEX "movimento_stock_produto_id_criado_em_idx" ON "movimento_stock"("produto_id", "criado_em");

-- CreateIndex
CREATE INDEX "movimento_stock_criado_por_idx" ON "movimento_stock"("criado_por");

-- CreateIndex
CREATE UNIQUE INDEX "movimento_stock_item_encomenda_id_tipo_movimento_key" ON "movimento_stock"("item_encomenda_id", "tipo_movimento");

-- CreateIndex
CREATE UNIQUE INDEX "movimento_stock_item_devolucao_id_tipo_movimento_key" ON "movimento_stock"("item_devolucao_id", "tipo_movimento");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacao_produto_item_encomenda_id_key" ON "avaliacao_produto"("item_encomenda_id");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacao_encomenda_encomenda_id_key" ON "avaliacao_encomenda"("encomenda_id");

-- CreateIndex
CREATE INDEX "pedido_assistencia_utilizador_id_idx" ON "pedido_assistencia"("utilizador_id");

-- CreateIndex
CREATE INDEX "pedido_assistencia_encomenda_id_idx" ON "pedido_assistencia"("encomenda_id");

-- CreateIndex
CREATE INDEX "pedido_assistencia_respondido_por_idx" ON "pedido_assistencia"("respondido_por");

-- CreateIndex
CREATE UNIQUE INDEX "devolucao_codigo_devolucao_key" ON "devolucao"("codigo_devolucao");

-- CreateIndex
CREATE INDEX "devolucao_encomenda_id_idx" ON "devolucao"("encomenda_id");

-- CreateIndex
CREATE INDEX "devolucao_decidido_por_idx" ON "devolucao"("decidido_por");

-- CreateIndex
CREATE INDEX "item_devolucao_item_encomenda_id_idx" ON "item_devolucao"("item_encomenda_id");

-- CreateIndex
CREATE UNIQUE INDEX "item_devolucao_devolucao_id_item_encomenda_id_key" ON "item_devolucao"("devolucao_id", "item_encomenda_id");

-- CreateIndex
CREATE UNIQUE INDEX "reembolso_devolucao_id_key" ON "reembolso"("devolucao_id");

-- CreateIndex
CREATE UNIQUE INDEX "reembolso_referencia_operacao_key" ON "reembolso"("referencia_operacao");

-- CreateIndex
CREATE INDEX "reembolso_pagamento_id_idx" ON "reembolso"("pagamento_id");

-- CreateIndex
CREATE INDEX "reembolso_processado_por_idx" ON "reembolso"("processado_por");

-- CreateIndex
CREATE UNIQUE INDEX "politica_loja_tipo_politica_key" ON "politica_loja"("tipo_politica");

-- CreateIndex
CREATE INDEX "politica_loja_actualizado_por_idx" ON "politica_loja"("actualizado_por");

-- CreateIndex
CREATE INDEX "registo_auditoria_utilizador_autor_id_idx" ON "registo_auditoria"("utilizador_autor_id");

-- CreateIndex
CREATE INDEX "registo_auditoria_tipo_entidade_id_entidade_idx" ON "registo_auditoria"("tipo_entidade", "id_entidade");

-- CreateIndex
CREATE INDEX "registo_auditoria_criado_em_idx" ON "registo_auditoria"("criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "products_codigo_key" ON "products"("codigo");

-- CreateIndex
CREATE INDEX "products_categoria_id_idx" ON "products"("categoria_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria" ADD CONSTRAINT "categoria_categoria_pai_id_fkey" FOREIGN KEY ("categoria_pai_id") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imagem_produto" ADD CONSTRAINT "imagem_produto_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endereco" ADD CONSTRAINT "endereco_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endereco" ADD CONSTRAINT "endereco_zona_entrega_id_fkey" FOREIGN KEY ("zona_entrega_id") REFERENCES "zona_entrega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_recuperacao" ADD CONSTRAINT "token_recuperacao_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carrinho" ADD CONSTRAINT "carrinho_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_carrinho" ADD CONSTRAINT "item_carrinho_carrinho_id_fkey" FOREIGN KEY ("carrinho_id") REFERENCES "carrinho"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_carrinho" ADD CONSTRAINT "item_carrinho_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encomenda" ADD CONSTRAINT "encomenda_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encomenda" ADD CONSTRAINT "encomenda_zona_entrega_id_fkey" FOREIGN KEY ("zona_entrega_id") REFERENCES "zona_entrega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encomenda" ADD CONSTRAINT "encomenda_modalidade_entrega_id_fkey" FOREIGN KEY ("modalidade_entrega_id") REFERENCES "modalidade_entrega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_encomenda" ADD CONSTRAINT "item_encomenda_encomenda_id_fkey" FOREIGN KEY ("encomenda_id") REFERENCES "encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_encomenda" ADD CONSTRAINT "item_encomenda_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_encomenda" ADD CONSTRAINT "item_encomenda_promocao_id_fkey" FOREIGN KEY ("promocao_id") REFERENCES "promocao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_estado_encomenda" ADD CONSTRAINT "historico_estado_encomenda_encomenda_id_fkey" FOREIGN KEY ("encomenda_id") REFERENCES "encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_estado_encomenda" ADD CONSTRAINT "historico_estado_encomenda_alterado_por_fkey" FOREIGN KEY ("alterado_por") REFERENCES "utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_encomenda_id_fkey" FOREIGN KEY ("encomenda_id") REFERENCES "encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento" ADD CONSTRAINT "pagamento_forma_pagamento_id_fkey" FOREIGN KEY ("forma_pagamento_id") REFERENCES "forma_pagamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifa_frete" ADD CONSTRAINT "tarifa_frete_zona_entrega_id_fkey" FOREIGN KEY ("zona_entrega_id") REFERENCES "zona_entrega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarifa_frete" ADD CONSTRAINT "tarifa_frete_modalidade_entrega_id_fkey" FOREIGN KEY ("modalidade_entrega_id") REFERENCES "modalidade_entrega"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrega" ADD CONSTRAINT "entrega_encomenda_id_fkey" FOREIGN KEY ("encomenda_id") REFERENCES "encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promocao" ADD CONSTRAINT "promocao_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promocao_produto" ADD CONSTRAINT "promocao_produto_promocao_id_fkey" FOREIGN KEY ("promocao_id") REFERENCES "promocao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promocao_produto" ADD CONSTRAINT "promocao_produto_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimento_stock" ADD CONSTRAINT "movimento_stock_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimento_stock" ADD CONSTRAINT "movimento_stock_item_encomenda_id_fkey" FOREIGN KEY ("item_encomenda_id") REFERENCES "item_encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimento_stock" ADD CONSTRAINT "movimento_stock_item_devolucao_id_fkey" FOREIGN KEY ("item_devolucao_id") REFERENCES "item_devolucao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimento_stock" ADD CONSTRAINT "movimento_stock_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao_produto" ADD CONSTRAINT "avaliacao_produto_item_encomenda_id_fkey" FOREIGN KEY ("item_encomenda_id") REFERENCES "item_encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacao_encomenda" ADD CONSTRAINT "avaliacao_encomenda_encomenda_id_fkey" FOREIGN KEY ("encomenda_id") REFERENCES "encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_assistencia" ADD CONSTRAINT "pedido_assistencia_utilizador_id_fkey" FOREIGN KEY ("utilizador_id") REFERENCES "utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_assistencia" ADD CONSTRAINT "pedido_assistencia_respondido_por_fkey" FOREIGN KEY ("respondido_por") REFERENCES "utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_assistencia" ADD CONSTRAINT "pedido_assistencia_encomenda_id_fkey" FOREIGN KEY ("encomenda_id") REFERENCES "encomenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucao" ADD CONSTRAINT "devolucao_encomenda_id_fkey" FOREIGN KEY ("encomenda_id") REFERENCES "encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucao" ADD CONSTRAINT "devolucao_decidido_por_fkey" FOREIGN KEY ("decidido_por") REFERENCES "utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_devolucao" ADD CONSTRAINT "item_devolucao_devolucao_id_fkey" FOREIGN KEY ("devolucao_id") REFERENCES "devolucao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_devolucao" ADD CONSTRAINT "item_devolucao_item_encomenda_id_fkey" FOREIGN KEY ("item_encomenda_id") REFERENCES "item_encomenda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reembolso" ADD CONSTRAINT "reembolso_devolucao_id_fkey" FOREIGN KEY ("devolucao_id") REFERENCES "devolucao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reembolso" ADD CONSTRAINT "reembolso_pagamento_id_fkey" FOREIGN KEY ("pagamento_id") REFERENCES "pagamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reembolso" ADD CONSTRAINT "reembolso_processado_por_fkey" FOREIGN KEY ("processado_por") REFERENCES "utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "politica_loja" ADD CONSTRAINT "politica_loja_actualizado_por_fkey" FOREIGN KEY ("actualizado_por") REFERENCES "utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registo_auditoria" ADD CONSTRAINT "registo_auditoria_utilizador_autor_id_fkey" FOREIGN KEY ("utilizador_autor_id") REFERENCES "utilizador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Complemento SQL ao schema Prisma (PostgreSQL 16).
-- Restricoes complementares ao schema Prisma.
-- CHECKs e indices parciais/funcionais nao sao representaveis no Prisma 6.

ALTER TABLE "products"
  ADD CONSTRAINT "products_preco_positivo" CHECK ("price" > 0),
  ADD CONSTRAINT "products_stock_nao_negativo" CHECK ("stock" >= 0),
  ADD CONSTRAINT "products_limiar_nao_negativo" CHECK ("limiar_stock_baixo" >= 0);

CREATE UNIQUE INDEX "imagem_produto_principal_unica"
  ON "imagem_produto" ("produto_id") WHERE "principal";
CREATE UNIQUE INDEX "endereco_predefinido_unico"
  ON "endereco" ("utilizador_id") WHERE "predefinido";
CREATE UNIQUE INDEX "utilizador_email_normalizado_unico"
  ON "utilizador" (lower("email"));
CREATE UNIQUE INDEX "pagamento_confirmado_unico"
  ON "pagamento" ("encomenda_id")
  WHERE "estado" IN ('CONFIRMADO', 'REEMBOLSADO');

ALTER TABLE "carrinho" ADD CONSTRAINT "carrinho_identificado"
  CHECK ("utilizador_id" IS NOT NULL OR "token_sessao" IS NOT NULL);
ALTER TABLE "item_carrinho" ADD CONSTRAINT "item_carrinho_quantidade_positiva"
  CHECK ("quantidade" > 0);

ALTER TABLE "encomenda"
  ADD CONSTRAINT "encomenda_subtotal_nao_negativo" CHECK ("valor_subtotal" >= 0),
  ADD CONSTRAINT "encomenda_desconto_nao_negativo" CHECK ("total_desconto" >= 0),
  ADD CONSTRAINT "encomenda_frete_nao_negativo" CHECK ("valor_frete" >= 0),
  ADD CONSTRAINT "encomenda_total_coerente" CHECK ("valor_total" = "valor_subtotal" - "total_desconto" + "valor_frete");

ALTER TABLE "item_encomenda"
  ADD CONSTRAINT "item_encomenda_quantidade_positiva" CHECK ("quantidade" > 0),
  ADD CONSTRAINT "item_encomenda_preco_nao_negativo" CHECK ("preco_unitario" >= 0),
  ADD CONSTRAINT "item_encomenda_desconto_valido" CHECK ("desconto_unitario" >= 0 AND "desconto_unitario" <= "preco_unitario"),
  ADD CONSTRAINT "item_encomenda_devolucao_limitada" CHECK ("quantidade_devolvida" >= 0 AND "quantidade_devolvida" <= "quantidade");

ALTER TABLE "pagamento"
  ADD CONSTRAINT "pagamento_valor_positivo" CHECK ("valor" > 0),
  ADD CONSTRAINT "pagamento_reembolso_limitado" CHECK ("valor_reembolsado" >= 0 AND "valor_reembolsado" <= "valor"),
  ADD CONSTRAINT "pagamento_confirmacao_datada" CHECK ("estado" NOT IN ('CONFIRMADO', 'REEMBOLSADO') OR "confirmado_em" IS NOT NULL);

ALTER TABLE "tarifa_frete"
  ADD CONSTRAINT "tarifa_frete_valor_nao_negativo" CHECK ("valor" >= 0),
  ADD CONSTRAINT "tarifa_frete_prazo_positivo" CHECK ("prazo_dias" > 0);
ALTER TABLE "entrega" ADD CONSTRAINT "entrega_conclusao_datada"
  CHECK ("estado" <> 'ENTREGUE' OR "entregue_em" IS NOT NULL);

ALTER TABLE "promocao"
  ADD CONSTRAINT "promocao_desconto_positivo" CHECK ("valor_desconto" > 0),
  ADD CONSTRAINT "promocao_percentagem_limitada" CHECK ("tipo_desconto" <> 'PERCENTAGEM' OR "valor_desconto" < 100),
  ADD CONSTRAINT "promocao_periodo_valido" CHECK ("fim_em" > "inicio_em");

ALTER TABLE "movimento_stock"
  ADD CONSTRAINT "movimento_variacao_nao_nula" CHECK ("variacao_quantidade" <> 0),
  ADD CONSTRAINT "movimento_stock_nao_negativo" CHECK ("stock_apos" >= 0),
  ADD CONSTRAINT "movimento_sinal_coerente" CHECK (
    ("tipo_movimento" = 'AJUSTE') OR
    ("tipo_movimento" = 'VENDA' AND "variacao_quantidade" < 0) OR
    ("tipo_movimento" IN ('ENTRADA', 'REPOSICAO_CANCELAMENTO', 'REPOSICAO_DEVOLUCAO') AND "variacao_quantidade" > 0)
  ),
  ADD CONSTRAINT "movimento_origem_coerente" CHECK (
    ("tipo_movimento" IN ('VENDA', 'REPOSICAO_CANCELAMENTO') AND "item_encomenda_id" IS NOT NULL AND "item_devolucao_id" IS NULL) OR
    ("tipo_movimento" = 'REPOSICAO_DEVOLUCAO' AND "item_devolucao_id" IS NOT NULL AND "item_encomenda_id" IS NULL) OR
    ("tipo_movimento" IN ('ENTRADA', 'AJUSTE') AND "item_encomenda_id" IS NULL AND "item_devolucao_id" IS NULL)
  );

ALTER TABLE "avaliacao_produto" ADD CONSTRAINT "avaliacao_produto_classificacao_valida"
  CHECK ("classificacao" BETWEEN 1 AND 5);
ALTER TABLE "avaliacao_encomenda" ADD CONSTRAINT "avaliacao_encomenda_classificacao_valida"
  CHECK ("classificacao_experiencia" BETWEEN 1 AND 5);
ALTER TABLE "devolucao" ADD CONSTRAINT "devolucao_rejeicao_justificada"
  CHECK ("estado" <> 'REJEITADA' OR "justificacao_decisao" IS NOT NULL);
ALTER TABLE "item_devolucao" ADD CONSTRAINT "item_devolucao_quantidade_positiva"
  CHECK ("quantidade" > 0);
ALTER TABLE "reembolso" ADD CONSTRAINT "reembolso_valor_positivo"
  CHECK ("valor" > 0);
ALTER TABLE "configuracao_loja" ADD CONSTRAINT "configuracao_loja_registo_unico"
  CHECK ("id" = 1);

COMMIT;
