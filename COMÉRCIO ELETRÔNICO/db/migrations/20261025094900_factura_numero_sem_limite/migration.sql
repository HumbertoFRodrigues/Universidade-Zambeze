-- lpad corta o texto: a partir da factura 10000 do ano o número deixaria de coincidir.
-- O número usa pelo menos 4 dígitos, sem limite superior.
ALTER TABLE "factura" DROP CONSTRAINT "factura_numero_coerente";
ALTER TABLE "factura" ADD CONSTRAINT "factura_numero_coerente"
  CHECK ("numero" = 'FT ' || "ano" || '/' || lpad("sequencia"::text, GREATEST(4, length("sequencia"::text)), '0'));
