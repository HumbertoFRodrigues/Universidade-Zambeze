import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { devolucoesApi } from "../../services/api.js";
import {
  ESTADOS_DEVOLUCAO_LISTA,
  ESTADOS_REEMBOLSO_LISTA,
  METODOS_REEMBOLSO,
} from "@/lib/devolucoes";

function Campo({ label, htmlFor, children, className = "" }) {
  return (
    <div className={className}>
      <Label
        htmlFor={htmlFor}
        className="font-heading text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground"
      >
        {label}
      </Label>
      <div className="mt-1.5">{children}</div>
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

export default function DevolucaoDetalhe({ devolucao, onGuardado, onFechar }) {
  const [valores, setValores] = useState({ ...devolucao });
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState("");

  const definir = (chave, valor) =>
    setValores((anterior) => ({ ...anterior, [chave]: valor }));

  const submeter = async (evento) => {
    evento.preventDefault();
    setErro("");
    setAGuardar(true);
    try {
      await devolucoesApi.actualizar(devolucao.id, {
        estado: valores.estado,
        reembolso_estado: valores.reembolso_estado,
        reembolso_valor: Number(valores.reembolso_valor) || 0,
        reembolso_metodo: valores.reembolso_metodo || "",
        reembolso_referencia: valores.reembolso_referencia || "",
        reembolso_data: valores.reembolso_data || null,
        notas_admin: valores.notas_admin || "",
        resposta_cliente: valores.resposta_cliente || "",
      });
      onGuardado();
    } catch {
      setErro("Não foi possível guardar a devolução.");
      setAGuardar(false);
    }
  };

  const itens = Array.isArray(devolucao.itens) ? devolucao.itens : [];

  return (
    <form onSubmit={submeter} className="space-y-8">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-heading text-sm font-semibold text-foreground">{devolucao.codigo}</p>
          <p className="text-xs text-muted-foreground">
            Encomenda: {devolucao.encomenda_codigo}
          </p>
        </div>

        <div className="rounded-[var(--radius)] border border-border p-4">
          <p className="font-heading text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground">
            Cliente
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">{devolucao.nome_cliente}</p>
          <p className="text-xs text-muted-foreground">{devolucao.email_cliente}</p>
        </div>

        <div className="rounded-[var(--radius)] border border-border p-4">
          <p className="font-heading text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground">
            Itens devolvidos
          </p>
          <ul className="mt-2 divide-y divide-border">
            {itens.map((item, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-foreground">{item.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantidade} un. · {item.motivo}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {devolucao.motivo_geral && (
            <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
              Motivo geral: {devolucao.motivo_geral}
            </p>
          )}
        </div>
      </div>

      <Secao titulo="Decisão da devolução">
        <Campo label="Estado da devolução" htmlFor="dd-estado">
          <Select value={valores.estado || "pendente"} onValueChange={(v) => definir("estado", v)}>
            <SelectTrigger id="dd-estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_DEVOLUCAO_LISTA.map((o) => (
                <SelectItem key={o.valor} value={o.valor}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
      </Secao>

      <Secao titulo="Reembolso">
        <Campo label="Estado do reembolso" htmlFor="dd-reembolso">
          <Select
            value={valores.reembolso_estado || "pendente"}
            onValueChange={(v) => definir("reembolso_estado", v)}
          >
            <SelectTrigger id="dd-reembolso">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_REEMBOLSO_LISTA.map((o) => (
                <SelectItem key={o.valor} value={o.valor}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Campo>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Valor do reembolso (MZN)" htmlFor="dd-valor">
            <Input
              id="dd-valor"
              type="number"
              step="0.01"
              value={valores.reembolso_valor || ""}
              onChange={(e) => definir("reembolso_valor", e.target.value)}
              placeholder="0.00"
            />
          </Campo>
          <Campo label="Método" htmlFor="dd-metodo">
            <Select
              value={valores.reembolso_metodo || "_nenhum"}
              onValueChange={(v) => definir("reembolso_metodo", v === "_nenhum" ? "" : v)}
            >
              <SelectTrigger id="dd-metodo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_nenhum">—</SelectItem>
                {METODOS_REEMBOLSO.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Campo>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Referência" htmlFor="dd-ref">
            <Input
              id="dd-ref"
              value={valores.reembolso_referencia || ""}
              onChange={(e) => definir("reembolso_referencia", e.target.value)}
              placeholder="Ex: TRF-998877"
            />
          </Campo>
          <Campo label="Data do reembolso" htmlFor="dd-data">
            <Input
              id="dd-data"
              type="date"
              value={valores.reembolso_data || ""}
              onChange={(e) => definir("reembolso_data", e.target.value)}
            />
          </Campo>
        </div>
      </Secao>

      <Secao titulo="Comunicação">
        <Campo label="Resposta ao cliente" htmlFor="dd-resposta">
          <Textarea
            id="dd-resposta"
            rows={3}
            value={valores.resposta_cliente || ""}
            onChange={(e) => definir("resposta_cliente", e.target.value)}
            placeholder="Mensagem visível para o cliente"
          />
        </Campo>
        <Campo label="Notas internas" htmlFor="dd-notas">
          <Textarea
            id="dd-notas"
            rows={2}
            value={valores.notas_admin || ""}
            onChange={(e) => definir("notas_admin", e.target.value)}
            placeholder="Notas internas da equipa"
          />
        </Campo>
      </Secao>

      {erro && (
        <p className="rounded-[var(--radius)] bg-destructive/10 p-3 text-sm text-destructive">
          {erro}
        </p>
      )}

      <Separator />
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onFechar} disabled={aGuardar}>
          Fechar
        </Button>
        <Button type="submit" disabled={aGuardar}>
          {aGuardar ? "A guardar..." : "Guardar alterações"}
        </Button>
      </div>
    </form>
  );
}