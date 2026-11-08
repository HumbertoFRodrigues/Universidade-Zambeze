import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { produtosApi } from "@/services/api";

const LIMITE = 8;

const FILTROS_INICIAIS = {
    categoria: "",
    marcas: [],
    precoMin: "",
    precoMax: "",
    disponibilidade: "todas",
    promocao: false,
    ordem: "-created_date",
};

function numeroOuNulo(valor) {
    if (valor === "" || valor === null || valor === undefined) return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}

function buildFilterParams(filtros, termo) {
    const params = { activo: true };

    if (filtros.categoria) params.categoria = filtros.categoria;
    if (filtros.marcas.length) params.marca = filtros.marcas.join(',');
    if (filtros.disponibilidade === "disponivel") params.disponivel = true;
    if (filtros.disponibilidade === "esgotado") params.esgotado = true;

    const minimo = numeroOuNulo(filtros.precoMin);
    const maximo = numeroOuNulo(filtros.precoMax);

    if (minimo !== null) params.precoMin = minimo;
    if (maximo !== null) params.precoMax = maximo;

    if (filtros.promocao) params.promocao = true;

    if (termo) params.q = termo;

    if (filtros.ordem) params.ordem = filtros.ordem;

    return params;
}

export default function useCatalogo() {
    const location = useLocation();
    const termo = new URLSearchParams(location.search).get("q") || "";

    const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
    const [produtos, setProdutos] = useState([]);
    const [total, setTotal] = useState(0);
    const [cursor, setCursor] = useState(null);
    const [temMais, setTemMais] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [carregandoMais, setCarregandoMais] = useState(false);
    const [marcas, setMarcas] = useState([]);

    const construirFiltro = useCallback(() => {
        return buildFilterParams(filtros, termo);
    }, [filtros, termo]);

    useEffect(() => {
        let activo = true;
        setCarregando(true);
        const params = construirFiltro();
        params.limit = LIMITE;

        produtosApi.listar(params)
            .then((response) => {
                if (!activo) return;
                const items = response?.produtos || response?.items || response || [];
                setProdutos(items);
                setTotal(items.length);
                setTemMais(false);
                setCursor(null);
            })
            .catch((error) => {
                console.error('Erro ao carregar catálogo:', error);
                if (!activo) return;
                setProdutos([]);
                setTemMais(false);
                setTotal(0);
            })
            .finally(() => {
                if (activo) setCarregando(false);
            });

        return () => {
            activo = false;
        };
    }, [construirFiltro, filtros.ordem]);

    useEffect(() => {
        let activo = true;

        produtosApi.listar({ activo: true, distinct: "marca" })
            .then((response) => {
                if (!activo) return;
                const items = response?.produtos || response?.items || response || [];
                const lista = items
                    .map((p) => (typeof p.marca === "string" ? p.marca : p.marca?.nome))
                    .filter(Boolean);
                setMarcas(Array.from(new Set(lista)).sort((a, b) => a.localeCompare(b, "pt")));
            })
            .catch(() => {
                if (activo) setMarcas([]);
            });

        return () => {
            activo = false;
        };
    }, []);

    const carregarMais = async () => {
        if (!temMais || carregandoMais || !cursor) return;
        setCarregandoMais(true);
        try {
            const params = construirFiltro();
            params.limit = LIMITE;
            params.cursor = cursor;
            const response = await produtosApi.listar(params);
            const items = response?.produtos || response?.items || response || [];
            setProdutos((anteriores) => [...anteriores, ...items]);
            setCursor(null);
            setTemMais(false);
        } finally {
            setCarregandoMais(false);
        }
    };

    const definirFiltro = (chave, valor) =>
        setFiltros((anteriores) => ({ ...anteriores, [chave]: valor }));

    const alternarCategoria = (nome) =>
        setFiltros((anteriores) => ({
            ...anteriores,
            categoria: anteriores.categoria === nome ? "" : nome,
        }));

    const alternarMarca = (nome) =>
        setFiltros((anteriores) => ({
            ...anteriores,
            marcas: anteriores.marcas.includes(nome)
                ? anteriores.marcas.filter((item) => item !== nome)
                : [...anteriores.marcas, nome],
        }));

    const limparFiltros = () =>
        setFiltros((anteriores) => ({ ...FILTROS_INICIAIS, ordem: anteriores.ordem }));

    const temFiltros = Boolean(
        termo ||
        filtros.categoria ||
        filtros.marcas.length ||
        filtros.precoMin ||
        filtros.precoMax ||
        filtros.disponibilidade !== "todas" ||
        filtros.promocao
    );

    const contagemFiltros =
        (filtros.categoria ? 1 : 0) +
        filtros.marcas.length +
        (filtros.precoMin || filtros.precoMax ? 1 : 0) +
        (filtros.disponibilidade !== "todas" ? 1 : 0) +
        (filtros.promocao ? 1 : 0) +
        (termo ? 1 : 0);

    return {
        produtos,
        total,
        carregando,
        carregandoMais,
        temMais,
        carregarMais,
        termo,
        filtros,
        marcas,
        temFiltros,
        contagemFiltros,
        definirFiltro,
        alternarCategoria,
        alternarMarca,
        limparFiltros,
    };
}