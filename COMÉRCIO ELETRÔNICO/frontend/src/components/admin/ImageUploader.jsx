import { useRef, useState } from "react";
import { uploadsApi } from '../../services/api';
import { ImagePlus, Loader2, X } from "lucide-react";
import { Image } from "@/components/ui/image";

export default function ImageUploader({ value, onChange, multiple = false }) {
  const entrada = useRef(null);
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState("");

  const lista = multiple
    ? Array.isArray(value)
      ? value
      : []
    : value
    ? [value]
    : [];

  const enviar = async (ficheiro) => {
    if (!ficheiro) return;
    setAEnviar(true);
    setErro("");
    try {
      const formData = new FormData();
      formData.append('file', ficheiro);
      const data = await uploadsApi.imagem(formData);
      if (multiple) onChange([...lista, data.url]);
      else onChange(data.url);
    } catch {
      setErro("Falha ao enviar a imagem. Tente novamente.");
    } finally {
      setAEnviar(false);
    }
  };

  const remover = (url) => {
    if (multiple) onChange(lista.filter((u) => u !== url));
    else onChange("");
  };

  return (
    <div>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const ficheiro = e.target.files?.[0];
          if (ficheiro) enviar(ficheiro);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap gap-3">
        {lista.map((url) => (
          <div
            key={url}
            className="relative h-20 w-20 overflow-hidden rounded-[var(--radius)] border border-border bg-muted"
          >
            <Image src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remover(url)}
              aria-label="Remover imagem"
              className="absolute right-1 top-1 rounded-full bg-foreground/80 p-1 text-background transition-colors hover:bg-foreground"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={aEnviar}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-[var(--radius)] border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
        >
          {aEnviar ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{aEnviar ? "A enviar" : "Enviar"}</span>
        </button>
      </div>
      {erro && <p className="mt-2 text-xs text-destructive">{erro}</p>}
    </div>
  );
}