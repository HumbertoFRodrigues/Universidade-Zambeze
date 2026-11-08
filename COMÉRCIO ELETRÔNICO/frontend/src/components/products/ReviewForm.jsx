import { useState } from "react";
import { Send } from "lucide-react";
import FormField from "@/components/forms/FormField";
import FeedbackMessage from "@/components/common/FeedbackMessage";
import StarRating from "./StarRating";

export default function ReviewForm({ onEnviada }) {
  const [nome, setNome] = useState("");
  const [classificacao, setClassificacao] = useState(0);
  const [comentario, setComentario] = useState("");
  const [erro, setErro] = useState("");
  const [estado, setEstado] = useState("inicial");

  const submeter = async (evento) => {
    evento.preventDefault();

    if (classificacao < 1) {
      setErro("Escolha uma classificação de 1 a 5 estrelas.");
      return;
    }
    if (!nome.trim()) {
      setErro("Indique o nome pelo qual quer ser identificado.");
      return;
    }

    setErro("");
    setEstado("enviando");

    try {
      setNome("");
      setClassificacao(0);
      setComentario("");
      setEstado("sucesso");
      await onEnviada?.();
    } catch {
      setEstado("inicial");
      setErro("Não foi possível enviar a avaliação. Tente novamente dentro de momentos.");
    }
  };

  return (
    <form onSubmit={submeter} className="rounded-[var(--radius)] border border-border p-6">
      <p className="font-heading text-sm font-semibold tracking-tight text-foreground">
        Deixe a sua avaliação
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        A sua opinião ajuda outros clientes a escolher o equipamento adequado.
      </p>

      <div className="mt-6">
        <span className="block font-heading text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
          Classificação
        </span>
        <StarRating
          valor={classificacao}
          tamanho="grande"
          className="mt-2"
          onChange={(valor) => {
            setClassificacao(valor);
            setErro("");
          }}
        />
      </div>

      <FormField
        id="avaliacao-nome"
        label="Nome"
        className="mt-6"
        value={nome}
        onChange={(evento) => setNome(evento.target.value)}
        placeholder="Como quer ser identificado"
        maxLength={60}
      />

      <div className="mt-6">
        <label
          htmlFor="avaliacao-comentario"
          className="block font-heading text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground"
        >
          Comentário
        </label>
        <textarea
          id="avaliacao-comentario"
          value={comentario}
          onChange={(evento) => setComentario(evento.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Descreva como foi a utilização do produto"
          className="mt-2 w-full rounded-[var(--radius)] border border-border bg-transparent p-3 text-sm text-foreground transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
        />
      </div>

      {erro && <FeedbackMessage className="mt-5" variante="erro" titulo={erro} />}

      {estado === "sucesso" && (
        <FeedbackMessage
          className="mt-5"
          variante="sucesso"
          titulo="Avaliação enviada. Obrigado pela partilha!"
          onFechar={() => setEstado("inicial")}
        />
      )}

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-primary px-6 font-heading text-xs uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {estado === "enviando" ? "A enviar…" : "Enviar avaliação"}
      </button>
    </form>
  );
}