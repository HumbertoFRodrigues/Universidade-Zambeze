import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SpecsEditor({ valor = [], onChange }) {
  const itens = Array.isArray(valor) ? valor : [];

  const atualizar = (indice, campo, valorCampo) => {
    onChange(
      itens.map((item, i) => (i === indice ? { ...item, [campo]: valorCampo } : item))
    );
  };

  const adicionar = () => onChange([...itens, { nome: "", valor: "" }]);

  const remover = (indice) => onChange(itens.filter((_, i) => i !== indice));

  return (
    <div className="space-y-2">
      {itens.length === 0 && (
        <p className="text-xs text-muted-foreground">Sem especificações adicionadas.</p>
      )}
      {itens.map((item, indice) => (
        <div key={indice} className="flex gap-2">
          <Input
            placeholder="Nome (ex: Material)"
            value={item.nome || ""}
            onChange={(e) => atualizar(indice, "nome", e.target.value)}
            className="flex-1"
          />
          <Input
            placeholder="Valor (ex: Polipropileno)"
            value={item.valor || ""}
            onChange={(e) => atualizar(indice, "valor", e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => remover(indice)}
            aria-label="Remover especificação"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={adicionar}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Adicionar especificação
      </Button>
    </div>
  );
}