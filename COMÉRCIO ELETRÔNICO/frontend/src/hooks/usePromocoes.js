import { useEffect, useState } from "react";
import { produtosApi } from "@/services/api";

export default function usePromocoes(limite = 4) {
  const [promocoes, setPromocoes] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let activo = true;

    const hoje = new Date().toISOString().slice(0, 10);
    produtosApi.listar({
      activo: true,
      promocao: true,
      promocao_fim_gte: hoje,
      sort: "-created_date",
      limit: limite,
    })
      .then((response) => {
        if (activo) {
          const items = response?.produtos || response?.items || response || [];
          setPromocoes(items);
        }
      })
      .catch(() => {
        if (activo) setPromocoes([]);
      })
      .finally(() => {
        if (activo) setCarregando(false);
      });

    return () => {
      activo = false;
    };
  }, [limite]);

  return { promocoes, carregando };
}