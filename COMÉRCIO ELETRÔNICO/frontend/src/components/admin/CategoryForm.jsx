import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FeedbackMessage from "@/components/common/FeedbackMessage";

const SEM_PAI = "nenhuma";

function Campo({ label, htmlFor, erro, ajuda, children }) {
  return (
    <div>
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

// Campos reais do modelo Categoria: nome (único, até 100 caracteres),
// categoriaPaiId (opcional) e activo.
export default function CategoryForm({ categoria, categorias, onSubmeter, onCancelar }) {
  const edicao = Boolean(categoria);
  const [valores, setValores] = useState({
    nome: categoria?.nome || "",
    categoriaPaiId: categoria?.categoriaPaiId ? String(categoria.categoriaPaiId) : "",
    activo: categoria ? !!categoria.activo : true,
  });
  const [erroNome, setErroNome] = useState("");
  const [erro, setErro] = useState("");
  const [aGuardar, setAGuardar] = useState(false);

  // Como na gestão anterior: apenas categorias principais podem ser categoria-pai,
  // e nunca a própria categoria.
  const opcoesPai = categorias.filter(
    (item) => item.categoriaPaiId == null && item.id !== categoria?.id
  );
  // Uma categoria com subcategorias tem de continuar a ser principal.
  const temSubcategorias = edicao && categorias.some((item) => item.categoriaPaiId === categoria.id);

  const submeter = async (evento) => {
    evento.preventDefault();
    const nome = valores.nome.trim();
    let mensagem = "";
    if (!nome) mensagem = "O nome da categoria é obrigatório.";
    else if (nome.length > 100) mensagem = "O nome não pode exceder 100 caracteres.";
    else if (categorias.some((item) => item.nome === nome && item.id !== categoria?.id)) {
      mensagem = "Já existe uma categoria com esse nome.";
    }
    setErroNome(mensagem);
    if (mensagem) return;

    setErro("");
    setAGuardar(true);
    try {
      await onSubmeter({
        nome,
        categoriaPaiId: valores.categoriaPaiId ? Number(valores.categoriaPaiId) : null,
        ...(edicao ? { activo: valores.activo } : {}),
      });
    } catch (error) {
      setErro(error.message || "Não foi possível guardar a categoria.");
    } finally {
      setAGuardar(false);
    }
  };

  return (
    <form onSubmit={submeter} noValidate className="space-y-6">
      <Campo label="Nome *" htmlFor="cf-nome" erro={erroNome}>
        <Input
          id="cf-nome"
          maxLength={100}
          value={valores.nome}
          onChange={(e) => setValores({ ...valores, nome: e.target.value })}
          aria-invalid={!!erroNome}
        />
      </Campo>

      <Campo
        label="Categoria principal"
        htmlFor="cf-pai"
        ajuda={temSubcategorias
          ? "Esta categoria tem subcategorias, por isso tem de continuar a ser principal."
          : "Deixe em branco para criar uma categoria principal."}
      >
        <Select
          disabled={temSubcategorias}
          value={valores.categoriaPaiId || SEM_PAI}
          onValueChange={(v) => setValores({ ...valores, categoriaPaiId: v === SEM_PAI ? "" : v })}
        >
          <SelectTrigger id="cf-pai">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SEM_PAI}>Nenhuma (categoria principal)</SelectItem>
            {opcoesPai.map((item) => (
              <SelectItem key={item.id} value={String(item.id)}>
                {item.nome}{item.activo ? "" : " (inactiva)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Campo>

      {edicao && (
        <div className="flex items-start justify-between gap-3 rounded-[var(--radius)] border border-border p-3 sm:max-w-md">
          <div>
            <p className="text-sm font-medium text-foreground">Activa</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Categorias inactivas não aparecem na lista de categorias da loja.</p>
          </div>
          <Switch
            checked={valores.activo}
            onCheckedChange={(v) => setValores({ ...valores, activo: !!v })}
            aria-label="Categoria activa"
          />
        </div>
      )}

      {erro && <FeedbackMessage variante="erro">{erro}</FeedbackMessage>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancelar} disabled={aGuardar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={aGuardar}>
          {aGuardar ? "A guardar…" : edicao ? "Guardar alterações" : "Criar categoria"}
        </Button>
      </div>
    </form>
  );
}
