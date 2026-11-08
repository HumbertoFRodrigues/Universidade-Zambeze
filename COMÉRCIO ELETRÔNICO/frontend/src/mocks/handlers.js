// src/mocks/handlers.js
import { http, HttpResponse } from "msw";
import { produtos, categorias, loja, avaliacoes, encomendas } from "./data";

const API = "/api";

// ---------- Helper: aplicar filtros de produtos ----------
function filtrarProdutos(url) {
  const params = Object.fromEntries(url.searchParams.entries());
  let lista = [...produtos];

  if (params.activo === "true") lista = lista.filter((p) => p.activo);
  if (params.categoria) lista = lista.filter((p) => p.categoria === params.categoria);
  if (params.marca) {
    const marcas = params.marca.split(",");
    lista = lista.filter((p) => marcas.includes(p.marca));
  }
  if (params.promocao === "true") lista = lista.filter((p) => p.promocao_activa);
  if (params.esgotado === "true") lista = lista.filter((p) => p.quantidade_stock <= 0);
  if (params.disponivel === "true") lista = lista.filter((p) => p.quantidade_stock > 0);
  if (params.precoMin) lista = lista.filter((p) => p.preco >= Number(params.precoMin));
  if (params.precoMax) lista = lista.filter((p) => p.preco <= Number(params.precoMax));
  if (params.q) {
    const q = params.q.toLowerCase();
    lista = lista.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        p.marca.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q) ||
        p.descricao?.toLowerCase().includes(q)
    );
  }
  if (params.search) {
    const q = params.search.toLowerCase();
    lista = lista.filter(
      (p) => p.nome.toLowerCase().includes(q) || p.codigo?.toLowerCase().includes(q)
    );
  }

  // Ordenação
  const ordem = params.ordem || params.sort || "-created_date";
  const desc = ordem.startsWith("-");
  const campo = ordem.replace(/^-/, "");
  lista.sort((a, b) => {
    const va = a[campo] ?? "";
    const vb = b[campo] ?? "";
    if (va < vb) return desc ? 1 : -1;
    if (va > vb) return desc ? -1 : 1;
    return 0;
  });

  // Paginação
  const limit = params.limit ? Number(params.limit) : lista.length;
  const cursor = params.cursor ? Number(params.cursor) : 0;
  const items = lista.slice(cursor, cursor + limit);
  const hasMore = cursor + limit < lista.length;

  return { items, total: lista.length, has_more: hasMore, next_cursor: hasMore ? cursor + limit : null };
}

export const handlers = [
  // ---------- Produtos ----------
  http.get(`${API}/produtos`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(filtrarProdutos(url));
  }),

  http.get(`${API}/produtos/:slug`, ({ params }) => {
    const produto = produtos.find((p) => p.slug === params.slug || String(p.id) === params.slug);
    if (!produto) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(produto);
  }),

  http.post(`${API}/produtos`, async ({ request }) => {
    const data = await request.json();
    const novo = { id: Date.now(), ...data, criado_em: new Date().toISOString() };
    produtos.unshift(novo);
    return HttpResponse.json(novo, { status: 201 });
  }),

  http.patch(`${API}/produtos/:id`, async ({ params, request }) => {
    const data = await request.json();
    const idx = produtos.findIndex((p) => String(p.id) === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    produtos[idx] = { ...produtos[idx], ...data };
    return HttpResponse.json(produtos[idx]);
  }),

  http.delete(`${API}/produtos/:id`, ({ params }) => {
    const idx = produtos.findIndex((p) => String(p.id) === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    produtos.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---------- Categorias ----------
  http.get(`${API}/categorias`, ({ request }) => {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    let lista = [...categorias];
    if (params.activo === "true") lista = lista.filter((c) => c.activo);
    if (params.sort === "ordem") lista.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    return HttpResponse.json({ items: lista, total: lista.length });
  }),

  http.post(`${API}/categorias`, async ({ request }) => {
    const data = await request.json();
    const novo = { id: Date.now(), ...data, criado_em: new Date().toISOString() };
    categorias.push(novo);
    return HttpResponse.json(novo, { status: 201 });
  }),

  http.patch(`${API}/categorias/:id`, async ({ params, request }) => {
    const data = await request.json();
    const idx = categorias.findIndex((c) => String(c.id) === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    categorias[idx] = { ...categorias[idx], ...data };
    return HttpResponse.json(categorias[idx]);
  }),

  http.delete(`${API}/categorias/:id`, ({ params }) => {
    const idx = categorias.findIndex((c) => String(c.id) === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    categorias.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ---------- Encomendas ----------
  http.get(`${API}/encomendas`, ({ request }) => {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    let lista = [...encomendas];
    if (params.estado) lista = lista.filter((e) => e.estado === params.estado);
    if (params.pagamento_estado) lista = lista.filter((e) => e.pagamento_estado === params.pagamento_estado);
    if (params.entrega_estado) lista = lista.filter((e) => e.entrega_estado === params.entrega_estado);
    if (params.search) {
      const q = params.search.toLowerCase();
      lista = lista.filter(
        (e) => e.codigo?.toLowerCase().includes(q) || e.nome_cliente?.toLowerCase().includes(q)
      );
    }
    const limit = params.limit ? Number(params.limit) : lista.length;
    return HttpResponse.json({ items: lista.slice(0, limit), total: lista.length, has_more: false });
  }),

  http.get(`${API}/encomendas/:id`, ({ params }) => {
    const enc = encomendas.find((e) => String(e.id) === params.id);
    if (!enc) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(enc);
  }),

  http.patch(`${API}/encomendas/:id`, async ({ params, request }) => {
    const data = await request.json();
    const idx = encomendas.findIndex((e) => String(e.id) === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    encomendas[idx] = { ...encomendas[idx], ...data, actualizado_em: new Date().toISOString() };
    return HttpResponse.json(encomendas[idx]);
  }),

  // ---------- Loja / Configuração ----------
  http.get(`${API}/loja`, () => HttpResponse.json(loja)),
  http.get(`${API}/configuracao-loja`, () => HttpResponse.json(loja)),

  // ---------- Avaliações ----------
  http.get(`${API}/produtos/:id/reviews`, ({ params }) => {
    const lista = avaliacoes.filter((a) => String(a.produto_id) === params.id);
    return HttpResponse.json({ items: lista, total: lista.length });
  }),

  http.post(`${API}/produtos/:id/reviews`, async ({ params, request }) => {
    const data = await request.json();
    const nova = {
      id: Date.now(),
      produto_id: params.id,
      ...data,
      aprovada: true,
      criado_em: new Date().toISOString(),
    };
    avaliacoes.push(nova);
    return HttpResponse.json(nova, { status: 201 });
  }),

  // ---------- Auth ----------
  http.post(`${API}/auth/login`, async ({ request }) => {
    const { email, password } = await request.json();
    if (email === "admin@easyshop.mz" && password === "admin123") {
      return HttpResponse.json({
        token: "mock-token-admin",
        user: { id: 1, nome: "Admin", email, perfil: "ADMINISTRADOR" },
      });
    }
    if (email === "cliente@easyshop.mz" && password === "cliente123") {
      return HttpResponse.json({
        token: "mock-token-cliente",
        user: { id: 2, nome: "Cliente Demo", email, perfil: "CLIENTE" },
      });
    }
    return HttpResponse.json({ message: "Credenciais inválidas" }, { status: 401 });
  }),

  http.post(`${API}/auth/register`, async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({
      token: "mock-token-novo",
      user: { id: Date.now(), nome: data.nome, email: data.email, perfil: "CLIENTE" },
    }, { status: 201 });
  }),

  http.get(`${API}/auth/me`, () => {
    const token = localStorage.getItem("token");
    if (!token) return new HttpResponse(null, { status: 401 });
    const user = token.includes("admin")
      ? { id: 1, nome: "Admin", email: "admin@easyshop.mz", perfil: "ADMINISTRADOR" }
      : { id: 2, nome: "Cliente Demo", email: "cliente@easyshop.mz", perfil: "CLIENTE" };
    return HttpResponse.json(user);
  }),

  http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 204 })),

  http.post(`${API}/auth/forgot-password`, () =>
    HttpResponse.json({ message: "Email enviado (mock)" })
  ),

  http.post(`${API}/auth/reset-password`, () =>
    HttpResponse.json({ message: "Password redefinida (mock)" })
  ),

  // ---------- Uploads ----------
  http.post(`${API}/uploads`, async ({ request }) => {
    // Sem servidor real: devolve um URL local (blob:) para o próprio ficheiro enviado.
    const ficheiro = (await request.formData()).get("file");
    if (!(ficheiro instanceof Blob)) {
      return HttpResponse.json({ message: "Nenhum ficheiro enviado (mock)" }, { status: 400 });
    }
    return HttpResponse.json({ url: URL.createObjectURL(ficheiro) });
  }),

  // ---------- Health ----------
  http.get(`${API}/health`, () => HttpResponse.json({ status: "ok", mock: true })),
];