ALTER TABLE "configuracao_loja"
ADD COLUMN "regras_comerciais" JSONB;

UPDATE "configuracao_loja"
SET "regras_comerciais" = '{
  "prazoDevolucaoDias": 7,
  "prazosEntrega": {"cidade": "1 a 2 dias úteis", "nacional": "3 a 7 dias úteis"},
  "atacado": [
    {"de": 1, "ate": 9, "desconto": 0},
    {"de": 10, "ate": 49, "desconto": 0.07},
    {"de": 50, "ate": 199, "desconto": 0.13},
    {"de": 200, "ate": null, "desconto": 0.2}
  ],
  "guiasTamanho": {},
  "vendedor": {}
}'::jsonb
WHERE "regras_comerciais" IS NULL;

CREATE TABLE "sessao_autenticacao" (
  "id" TEXT NOT NULL,
  "utilizador_id" INTEGER NOT NULL,
  "hash_token" VARCHAR(64) NOT NULL,
  "expira_em" TIMESTAMPTZ(6) NOT NULL,
  "revogado_em" TIMESTAMPTZ(6),
  "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sessao_autenticacao_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "sessao_autenticacao_utilizador_id_fkey"
    FOREIGN KEY ("utilizador_id") REFERENCES "utilizador"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "sessao_autenticacao_hash_token_key"
ON "sessao_autenticacao"("hash_token");

CREATE INDEX "sessao_autenticacao_utilizador_id_expira_em_idx"
ON "sessao_autenticacao"("utilizador_id", "expira_em");
