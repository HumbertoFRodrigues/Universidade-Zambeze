export const MOEDA = "MZN";

export function formatarMZN(valor) {
  const numero = Number(valor || 0);
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: MOEDA,
    minimumFractionDigits: 2,
  }).format(numero);
}

export function promocaoValida(produto) {
  if (!produto?.promocao_activa || !produto?.preco_promocional) return false;
  if (!produto.promocao_fim) return true;
  const fim = new Date(produto.promocao_fim);
  fim.setHours(23, 59, 59, 999);
  return fim >= new Date();
}

export function precoAplicado(produto) {
  return promocaoValida(produto)
    ? Number(produto.preco_promocional)
    : Number(produto?.preco || 0);
}

export function descontoPercentual(produto) {
  if (!promocaoValida(produto)) return 0;
  const base = Number(produto.preco || 0);
  if (base <= 0) return 0;
  return Math.round((1 - Number(produto.preco_promocional) / base) * 100);
}

export function estadoStock(produto) {
  const stock = Number(produto?.quantidade_stock || 0);
  if (stock <= 0) return { chave: "esgotado", etiqueta: "Esgotado" };
  const limiar = Number(produto?.limiar_stock_baixo ?? 5);
  if (stock <= limiar) return { chave: "limitado", etiqueta: "Stock limitado" };
  return { chave: "disponivel", etiqueta: "Em stock" };
}

export function dataLegivel(valor) {
  if (!valor) return "";
  const data = new Date(valor);
  return data.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function nomeCategoria(categoria) {
  if (!categoria) return "Sem categoria";
  if (typeof categoria === "string") return categoria;
  return categoria.nome || "Sem categoria";
}

export function nomeMarca(marca) {
  if (!marca) return "";
  if (typeof marca === "string") return marca;
  return marca.nome || "";
}