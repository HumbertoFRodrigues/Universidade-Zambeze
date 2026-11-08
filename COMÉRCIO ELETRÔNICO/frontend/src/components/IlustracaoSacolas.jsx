// Sacola de compras simples, em laranja, usada no carrinho vazio
export function IlustracaoSacolas({ largura = 110 }) {
    return <svg className="sacolas" width={largura} viewBox="0 0 100 100" role="img" aria-label="Sacola de compras vazia">
    <path d="M16 30h68a4 4 0 0 1 4 4.4l-4.6 48A8 8 0 0 1 75.5 90h-51a8 8 0 0 1-8-7.6l-4.6-48A4 4 0 0 1 16 30z" fill="#fbefe6" stroke="#d97a3b" strokeWidth="5" strokeLinejoin="round" />
    <path d="M34 30V24a16 16 0 0 1 32 0v6" fill="none" stroke="#d97a3b" strokeWidth="5" strokeLinecap="round" />
    <path d="M36 48c2 9 7 13 14 13s12-4 14-13" fill="none" stroke="#d97a3b" strokeWidth="5" strokeLinecap="round" />
    </svg>
}