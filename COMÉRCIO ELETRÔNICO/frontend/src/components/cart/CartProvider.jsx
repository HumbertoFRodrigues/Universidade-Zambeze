import { createContext, useContext, useEffect, useState } from "react";
import { precoAplicado } from "@/lib/format";

const CHAVE = "easyshop.carrinho.v1";
const CartContext = createContext(null);

function lerCarrinho() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    const dados = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

function criarItem(produto, quantidade) {
  return {
    id: produto.id,
    nome: produto.nome,
    marca: produto.marca,
    categoria: produto.categoria,
    imagem_principal: produto.imagem_principal,
    preco: produto.preco,
    preco_promocional: produto.preco_promocional,
    promocao_activa: produto.promocao_activa,
    promocao_fim: produto.promocao_fim,
    quantidade_stock: Number(produto.quantidade_stock || 0),
    quantidade,
  };
}

export function CartProvider({ children }) {
  const [itens, setItens] = useState(lerCarrinho);
  const [aberto, setAberto] = useState(false);
  const [mensagem, setMensagem] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch {
      // carrinho permanece apenas em memória se o armazenamento estiver indisponível
    }
  }, [itens]);

  const adicionar = (produto, quantidade = 1) => {
    if (!produto || produto.activo === false) {
      return { ok: false, mensagem: "Este produto não está disponível para venda." };
    }
    const stock = Number(produto.quantidade_stock || 0);
    if (stock <= 0) {
      return { ok: false, mensagem: "Produto esgotado: não pode ser adicionado ao carrinho." };
    }

    const existente = itens.find((item) => item.id === produto.id);
    const desejada = (existente?.quantidade || 0) + Math.max(1, Math.round(quantidade));
    const permitida = Math.min(desejada, stock);
    const limitada = permitida < desejada;

    const actualizados = existente
      ? itens.map((item) =>
          item.id === produto.id
            ? { ...item, quantidade: permitida, quantidade_stock: stock }
            : item
        )
      : [...itens, criarItem(produto, permitida)];

    setItens(actualizados);
    setMensagem(
      limitada
        ? `A quantidade foi ajustada: só existem ${stock} unidades disponíveis.`
        : null
    );

    return { ok: true, quantidade: permitida, limitada };
  };

  const alterarQuantidade = (id, quantidade) => {
    const item = itens.find((entrada) => entrada.id === id);
    if (!item) return;
    const valor = Math.round(Number(quantidade) || 1);
    const permitida = Math.max(1, Math.min(valor, item.quantidade_stock));
    setItens(itens.map((entrada) => (entrada.id === id ? { ...entrada, quantidade: permitida } : entrada)));
    if (permitida < valor) {
      setMensagem(`A quantidade foi ajustada: só existem ${item.quantidade_stock} unidades disponíveis.`);
    }
  };

  const remover = (id) => {
    setItens(itens.filter((item) => item.id !== id));
    setMensagem(null);
  };

  const esvaziar = () => {
    setItens([]);
    setMensagem(null);
  };

  const subtotal = itens.reduce(
    (total, item) => total + precoAplicado(item) * item.quantidade,
    0
  );
  const contagem = itens.reduce((total, item) => total + item.quantidade, 0);
  const valor = {
    itens,
    adicionar,
    alterarQuantidade,
    remover,
    esvaziar,
    subtotal,
    contagem,
    aberto,
    abrirCarrinho: () => setAberto(true),
    fecharCarrinho: () => setAberto(false),
    mensagem,
    limparMensagem: () => setMensagem(null),
  };

  return <CartContext.Provider value={valor}>{children}</CartContext.Provider>;
}

export function useCart() {
  const contexto = useContext(CartContext);
  if (!contexto) throw new Error("useCart deve ser usado dentro de CartProvider.");
  return contexto;
}