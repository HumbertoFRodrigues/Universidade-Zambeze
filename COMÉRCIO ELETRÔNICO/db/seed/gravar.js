// Ordem topologica das dependencias; todos os modelos sao inicializados.
export const ordemModelos = [
  'categoria', 'utilizador', 'empresa', 'zonaEntrega', 'modalidadeEntrega', 'formaPagamento',
  'configuracaoLoja', 'politicaLoja', 'tarifaFrete', 'produto', 'imagemProduto',
  'endereco', 'tokenRecuperacao', 'sessaoAutenticacao', 'promocao', 'promocaoProduto', 'carrinho',
  'itemCarrinho', 'encomenda', 'itemEncomenda', 'historicoEstadoEncomenda',
  'pagamento', 'entrega', 'devolucao', 'itemDevolucao', 'reembolso',
  'movimentoStock', 'avaliacaoProduto', 'avaliacaoEncomenda', 'pedidoAssistencia',
  'registoAuditoria', 'descontoGrupo', 'cotacao', 'itemCotacao', 'factura', 'serieFactura',
]

export async function gravarDadosSeed(prisma, dados) {
  return prisma.$transaction(async tx => {
    // Evita duas execucoes simultaneas do seed, sem bloqueio persistente.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(20261011)`
    const resultado = {}
    for (const modelo of ordemModelos) {
      const linhas = dados[modelo]
      let inseridos = 0
      for (let inicio = 0; inicio < linhas.length; inicio += 250) {
        const lote = linhas.slice(inicio, inicio + 250)
        inseridos += (await tx[modelo].createMany({ data: lote, skipDuplicates: true })).count
      }
      // Um conflito num email/SKU/nome nao pode deixar uma FK a apontar
      // para um ID de fixture que nao foi criado. Falhar reverte tudo.
      const ids = linhas.filter(linha => 'id' in linha).map(linha => linha.id)
      if (ids.length && await tx[modelo].count({ where: { id: { in: ids } } }) !== ids.length) {
        throw new Error(`Conflito de identidade em ${modelo}. Nenhum dado existente foi sobrescrito.`)
      }
      resultado[modelo] = { previstos: linhas.length, inseridos, preservados: linhas.length - inseridos }
    }
    await tx.$executeRaw`
      DO $sequence_sync$
      DECLARE
        sequence_record record;
      BEGIN
        FOR sequence_record IN
          SELECT
            table_namespace.nspname AS schema_name,
            table_class.relname AS table_name,
            column_info.attname AS column_name,
            pg_get_serial_sequence(
              format('%I.%I', table_namespace.nspname, table_class.relname),
              column_info.attname
            ) AS sequence_name
          FROM pg_class table_class
          JOIN pg_namespace table_namespace ON table_namespace.oid = table_class.relnamespace
          JOIN pg_attribute column_info ON column_info.attrelid = table_class.oid
          WHERE table_namespace.nspname = 'public'
            AND table_class.relkind IN ('r', 'p')
            AND column_info.attnum > 0
            AND NOT column_info.attisdropped
            AND pg_get_serial_sequence(
              format('%I.%I', table_namespace.nspname, table_class.relname),
              column_info.attname
            ) IS NOT NULL
        LOOP
          EXECUTE format(
            'SELECT setval(%L, GREATEST(COALESCE(MAX(%I), 1), 1), COUNT(*) > 0) FROM %I.%I',
            sequence_record.sequence_name,
            sequence_record.column_name,
            sequence_record.schema_name,
            sequence_record.table_name
          );
        END LOOP;
      END;
      $sequence_sync$;
    `
    return resultado
  }, { maxWait: 15000, timeout: 180000 })
}
