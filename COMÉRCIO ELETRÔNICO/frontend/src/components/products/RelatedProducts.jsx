import { useEffect, useState } from "react";
import { produtosApi } from "@/services/api";
import Container from "@/components/common/Container";
import SectionHeading from "@/components/common/SectionHeading";
import { GrelhaEsqueleto } from "@/components/common/ProductCardSkeleton";
import ProductGrid from "./ProductGrid";

const CLASSE_GRELHA = "md:grid-cols-3 lg:grid-cols-4";

export default function RelatedProducts({ produto }) {
  const [relacionados, setRelacionados] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let activo = true;

    if (!produto?.categoria) {
      return undefined;
    }

    produtosApi.listar({
      activo: true,
      categoria: produto.categoria,
      excludeId: produto.id,
      sort: "-created_date",
      limit: 4,
    })
      .then((response) => {
        if (activo) {
          const items = response?.produtos || response?.items || response || [];
          setRelacionados(items.filter(p => p.id !== produto.id).slice(0, 4));
        }
      })
      .catch(() => {
        if (activo) setRelacionados([]);
      })
      .finally(() => {
        if (activo) setCarregando(false);
      });

    return () => {
      activo = false;
    };
  }, [produto?.categoria, produto?.id]);

  if (!carregando && relacionados.length === 0) return null;

  return (
    <section className="border-t border-border py-16 lg:py-20">
      <Container>
        <SectionHeading
          eyebrow="Relacionados"
          titulo={`Mais em ${produto.categoria || "catálogo"}`}
          descricao="Outros equipamentos da mesma categoria que podem completar a sua protecção."
        />
        <div className="mt-12">
          {carregando ? (
            <GrelhaEsqueleto itens={4} className={CLASSE_GRELHA} />
          ) : (
            <ProductGrid produtos={relacionados} className={CLASSE_GRELHA} />
          )}
        </div>
      </Container>
    </section>
  );
}