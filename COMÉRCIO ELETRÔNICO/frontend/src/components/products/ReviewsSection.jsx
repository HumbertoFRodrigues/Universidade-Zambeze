import { useCallback, useEffect, useState } from "react";
import Container from "@/components/common/Container";
import SectionHeading from "@/components/common/SectionHeading";
import StarRating from "./StarRating";
import ReviewForm from "./ReviewForm";
import { dataLegivel } from "@/lib/format";

export default function ReviewsSection({ produto }) {
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [resumo, setResumo] = useState({ media: 0, total: 0 });
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      setAvaliacoes([]);
      setResumo({ media: 0, total: 0 });
    } catch {
      setAvaliacoes([]);
      setResumo({ media: 0, total: 0 });
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <section className="border-t border-border py-16 lg:py-20">
      <Container>
        <SectionHeading
          eyebrow="Avaliações"
          titulo="O que dizem os clientes"
          descricao="Classificações e comentários de quem já adquiriu este produto."
        />

        <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <div className="flex items-center gap-5 border-b border-border pb-6">
              <span className="font-heading text-4xl font-semibold text-foreground">
                {resumo.total > 0 ? resumo.media.toFixed(1) : "—"}
              </span>
              <div>
                <StarRating valor={resumo.media} tamanho="grande" />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {resumo.total === 1 ? "1 avaliação" : `${resumo.total} avaliações`}
                </p>
              </div>
            </div>

            {carregando ? (
              <p className="mt-6 text-sm text-muted-foreground">A carregar avaliações…</p>
            ) : avaliacoes.length === 0 ? (
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                Este produto ainda não tem avaliações. Se já o adquiriu, partilhe a sua experiência.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {avaliacoes.map((avaliacao) => (
                  <li key={avaliacao.id} className="py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {avaliacao.nome_cliente || "Cliente EasyShop"}
                        </p>
                        <StarRating valor={Number(avaliacao.classificacao || 0)} className="mt-1.5" />
                      </div>
                      {avaliacao.created_date && (
                        <span className="text-xs text-muted-foreground">
                          {dataLegivel(avaliacao.created_date)}
                        </span>
                      )}
                    </div>
                    {avaliacao.comentario && (
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        {avaliacao.comentario}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <ReviewForm produto={produto} onEnviada={carregar} />
        </div>
      </Container>
    </section>
  );
}