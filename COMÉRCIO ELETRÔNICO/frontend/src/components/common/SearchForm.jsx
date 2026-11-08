import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import FormField from "@/components/forms/FormField";
import { cn } from "@/lib/utils";

export default function SearchForm({
  id = "pesquisa-produtos",
  tamanho = "compacto",
  className,
  onPesquisar,
}) {
  const [termo, setTermo] = useState("");
  const navigate = useNavigate();
  const destaque = tamanho === "destaque";

  const submeter = (evento) => {
    evento.preventDefault();
    const valor = termo.trim();
    navigate(valor ? `/?q=${encodeURIComponent(valor)}#produtos` : "/#produtos");
    onPesquisar?.();
  };

  return (
    <form
      onSubmit={submeter}
      role="search"
      className={cn("flex items-end gap-3", className)}
    >
      <FormField
        id={id}
        label="Pesquisar produtos"
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
        placeholder={destaque ? "Capacete, luvas, botas, 3M…" : "Pesquisar…"}
        inputClassName={destaque ? "text-lg" : "text-sm"}
      />
      <button
        type="submit"
        aria-label="Pesquisar produtos"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary text-primary-foreground transition-transform hover:-translate-y-0.5",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--primary))]",
          destaque ? "h-12 w-12" : "h-11 w-11"
        )}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}