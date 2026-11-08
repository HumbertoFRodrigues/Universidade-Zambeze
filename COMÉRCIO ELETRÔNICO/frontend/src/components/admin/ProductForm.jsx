import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import FeedbackMessage from "@/components/common/FeedbackMessage";
import { formatarMZN } from "@/lib/format";
import { precoValido } from "@/lib/produtosAdmin";

function Campo({ label, htmlFor, erro, ajuda, children, className = "" }) {
  return (
    <div className={className}>
      <Label
        htmlFor={htmlFor}
        className="font-heading text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground"
      >
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
      {ajuda && !erro && <p className="mt-1 text-xs text-muted-foreground">{ajuda}</p>}
      {erro && <p className="mt-1 text-xs text-destructive">{erro}</p>}
    </div>
  );
}

function Secao({ titulo, children }) {
  return (
    <section className="space-y-4">
      <p className="font-heading text-[0.68rem] uppercase tracking-[0.18em] text-primary">
        {titulo}
      </p>
      {children}
    </section>
  );
}

function valoresIniciais(produto) {
  if (!produto) {
    return {
      nome: "", codigo: "", marca: "", categoriaId: "", descricao: "",
      preco: "", quantidadeStock: "0", limiarStockBaixo: "5", activo: true,
    };
  }
  return {
    nome: produto.nome || "",
    codigo: produto.codigo || "",
    marca: produto.marca || "",
    categoriaId: produto.categoria?.id ? String(produto.categoria.id) : "",
    descricao: produto.descricao || "",
    limiarStockBaixo: produto.limiarStockBaixo === null || produto.limiarStockBaixo === undefined ? "" : String(produto.limiarStockBaixo),
    activo: !!produto.activo,
  };
}

const inteiroNaoNegativo = (valor) => /^\d+$/.test(String(valor).trim());

// Validações equivalentes às do backend (POST/PUT /admin/produtos).
function validar(valores, criacao) {
  const erros = {};
  if (!valores.nome.trim()) erros.nome = "O nome é obrigatório.";
  if (!valores.categoriaId) erros.categoriaId = "Seleccione uma categoria.";
  if (criacao) {
    if (!precoValido(valores.preco)) erros.preco = "Indique um preço maior que zero, com até 2 casas decimais.";
    if (!inteiroNaoNegativo(valores.quantidadeStock)) erros.quantidadeStock = "Indique um número inteiro igual ou superior a zero.";
  }
  if ((criacao || valores.limiarStockBaixo !== "") && !inteiroNaoNegativo(valores.limiarStockBaixo)) {
    erros.limiarStockBaixo = "Indique um número inteiro igual ou superior a zero.";
  }
  return erros;
}

export default function ProductForm({ produto, categorias, onSubmeter, onCancelar }) {
  const criacao = !produto;
  const [valores, setValores] = useState(() => valoresIniciais(produto));
  const [erros, setErros] = useState({});
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState("");

  const definir = (chave, valor) =>
    setValores((anterior) => ({ ...anterior, [chave]: valor }));

  // Mantém visível a categoria actual mesmo que tenha sido desactivada.
  const opcoesCategoria = categorias.filter(
    (categoria) => categoria.activo !== false || String(categoria.id) === valores.categoriaId
  );

  const submeter = async (evento) => {
    evento.preventDefault();
    const novosErros = validar(valores, criacao);
    setErros(novosErros);
    if (Object.keys(novosErros).length) {
      setErro("Corrija os campos assinalados.");
      return;
    }
    setErro("");
    setAGuardar(true);

    const dados = {
      nome: valores.nome.trim(),
      codigo: valores.codigo.trim(),
      marca: valores.marca.trim(),
      categoriaId: Number(valores.categoriaId),
      descricao: valores.descricao.trim(),
      ...(valores.limiarStockBaixo !== "" ? { limiarStockBaixo: Number(valores.limiarStockBaixo) } : {}),
      ...(criacao
        ? { preco: Number(String(valores.preco).replace(",", ".")), quantidadeStock: Number(valores.quantidadeStock) }
        : { activo: valores.activo }),
    };

    try {
      await onSubmeter(dados);
    } catch (error) {
      setErro(error.message || "Não foi possível guardar o produto.");
    } finally {
      setAGuardar(false);
    }
  };

  return (
    <form onSubmit={submeter} noValidate className="space-y-8">
      <Secao titulo="Identificação">
        <Campo label="Nome *" htmlFor="pf-nome" erro={erros.nome}>
          <Input
            id="pf-nome"
            maxLength={200}
            value={valores.nome}
            onChange={(e) => definir("nome", e.target.value)}
            aria-invalid={!!erros.nome}
          />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Código / Referência" htmlFor="pf-codigo" ajuda="Opcional. Tem de ser único.">
            <Input
              id="pf-codigo"
              maxLength={50}
              value={valores.codigo}
              onChange={(e) => definir("codigo", e.target.value)}
            />
          </Campo>
          <Campo label="Marca" htmlFor="pf-marca">
            <Input
              id="pf-marca"
              maxLength={100}
              value={valores.marca}
              onChange={(e) => definir("marca", e.target.value)}
            />
          </Campo>
        </div>
        <Campo label="Categoria *" htmlFor="pf-categoria" erro={erros.categoriaId}>
          <Select value={valores.categoriaId} onValueChange={(v) => definir("categoriaId", v)}>
            <SelectTrigger id="pf-categoria" aria-invalid={!!erros.categoriaId}>
              <SelectValue placeholder={categorias.length ? "Seleccionar categoria" : "Sem categorias disponíveis"} />
            </SelectTrigger>
            <SelectContent>
              {opcoesCategoria.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.nome}{c.activo === false ? " (inactiva)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <Campo label="Descrição" htmlFor="pf-desc">
          <Textarea
            id="pf-desc"
            rows={5}
            value={valores.descricao}
            onChange={(e) => definir("descricao", e.target.value)}
          />
        </Campo>
      </Secao>

      <Secao titulo={criacao ? "Preço e stock inicial" : "Preço e stock"}>
        {criacao ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo label="Preço (MZN) *" htmlFor="pf-preco" erro={erros.preco}>
              <Input
                id="pf-preco"
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={valores.preco}
                onChange={(e) => definir("preco", e.target.value)}
                aria-invalid={!!erros.preco}
              />
            </Campo>
            <Campo label="Stock inicial" htmlFor="pf-stock" erro={erros.quantidadeStock} ajuda="Fica registado como entrada de stock.">
              <Input
                id="pf-stock"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={valores.quantidadeStock}
                onChange={(e) => definir("quantidadeStock", e.target.value)}
                aria-invalid={!!erros.quantidadeStock}
              />
            </Campo>
            <Campo label="Limiar de stock baixo" htmlFor="pf-limiar" erro={erros.limiarStockBaixo}>
              <Input
                id="pf-limiar"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={valores.limiarStockBaixo}
                onChange={(e) => definir("limiarStockBaixo", e.target.value)}
                aria-invalid={!!erros.limiarStockBaixo}
              />
            </Campo>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <Campo label="Preço actual">
              <p className="py-2 font-mono text-sm">{formatarMZN(produto.preco)}</p>
              <Link to="../precos" relative="path" className="text-xs text-primary hover:underline">Alterar na página de preços</Link>
            </Campo>
            <Campo label="Stock actual">
              <p className="py-2 font-mono text-sm">{produto.quantidadeStock} un.</p>
              <p className="text-xs text-muted-foreground">Alterado através de movimentos de stock.</p>
            </Campo>
            <Campo label="Limiar de stock baixo" htmlFor="pf-limiar" erro={erros.limiarStockBaixo}>
              <Input
                id="pf-limiar"
                type="number"
                inputMode="numeric"
                min="0"
                step="1"
                value={valores.limiarStockBaixo}
                onChange={(e) => definir("limiarStockBaixo", e.target.value)}
                aria-invalid={!!erros.limiarStockBaixo}
              />
            </Campo>
          </div>
        )}
      </Secao>

      {!criacao && (
        <Secao titulo="Estado">
          <div className="flex items-start justify-between gap-3 rounded-[var(--radius)] border border-border p-3 sm:max-w-md">
            <div>
              <p className="text-sm font-medium text-foreground">Activo</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Produtos inactivos não aparecem na loja.</p>
            </div>
            <Switch checked={valores.activo} onCheckedChange={(v) => definir("activo", !!v)} aria-label="Activo" />
          </div>
        </Secao>
      )}

      {erro && <FeedbackMessage variante="erro">{erro}</FeedbackMessage>}

      <Separator />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={aGuardar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={aGuardar}>
          {aGuardar ? "A guardar…" : criacao ? "Criar produto" : "Guardar alterações"}
        </Button>
      </div>
    </form>
  );
}
