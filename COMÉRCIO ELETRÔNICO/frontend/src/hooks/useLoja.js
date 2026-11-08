import { useEffect, useState } from "react";

export const LOJA_PADRAO = {
  nome_marca: "EasyShop",
  slogan: "Equipamentos de segurança para quem não pode falhar.",
  sobre:
    "Loja online moçambicana de equipamentos de protecção individual e de segurança, com produtos de várias marcas para construção, indústria, logística e resposta a emergências.",
  morada: "",
  referencia_localizacao: "",
  telefone: "",
  email: "",
  horario_atendimento: "",
  codigo_moeda: "MZN",
};

let cache = null;

export default function useLoja() {
  const [loja, setLoja] = useState(cache || LOJA_PADRAO);
  const [carregando, setCarregando] = useState(!cache);

  useEffect(() => {
    if (cache) return undefined;
    let activo = true;

    setTimeout(() => {
      if (activo) {
        cache = LOJA_PADRAO;
        setLoja(cache);
        setCarregando(false);
      }
    }, 100);

    return () => {
      activo = false;
    };
  }, []);

  return { loja, carregando };
}