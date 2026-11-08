import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import Container from "@/components/common/Container";
import SearchForm from "@/components/common/SearchForm";

const IMAGEM_HERO = "/imagens/home/hero.jpg";

export default function HeroSection({ loja, totalCategorias }) {
  return (
    <section className="border-b border-border">
      <Container className="grid items-center gap-14 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div className="animate-rise-in">
          <p className="font-heading text-[0.68rem] uppercase tracking-[0.22em] text-primary">
            Equipamentos de segurança · Moçambique
          </p>
          <h1 className="mt-6 font-heading text-4xl font-semibold leading-[1.08] text-foreground sm:text-5xl lg:text-[3.6rem]">
            {loja.slogan}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            {loja.sobre}
          </p>

          <SearchForm id="pesquisa-hero" tamanho="destaque" className="mt-9 max-w-xl" />

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link
              to="/#categorias"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius)] bg-primary px-6 font-heading text-xs uppercase tracking-[0.14em] text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Explorar categorias <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/#promocoes"
              className="inline-flex min-h-[44px] items-center rounded-[var(--radius)] border border-border px-6 font-heading text-xs uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Ver promoções
            </Link>
          </div>

          {totalCategorias > 0 && (
            <p className="mt-6 text-xs text-muted-foreground">
              {totalCategorias} categorias de protecção · preços em meticais (MZN)
            </p>
          )}
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[var(--radius)] bg-muted">
            <Image
              src={IMAGEM_HERO}
              alt="Equipamentos de protecção individual disponíveis na EasyShop"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}