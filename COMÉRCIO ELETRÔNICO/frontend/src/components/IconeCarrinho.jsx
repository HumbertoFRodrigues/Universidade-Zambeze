// Carrinho de compras cheio, na cor do texto. A cor muda no CSS.
export function IconeCarrinho({ tamanho = 22 }) {
    return <svg className="icone-carrinho" width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden="true">
    <path d="M2 3h4.3c.7 0 1.3.5 1.5 1.2L8.4 7H28c.8 0 1.4.8 1.2 1.6l-2.3 9.1c-.2.7-.8 1.2-1.5 1.2H11.6c-.7 0-1.3-.5-1.5-1.2L6.2 5H2a1 1 0 0 1 0-2z" fill="currentColor" />
    <circle cx="12" cy="25.5" r="2.6" fill="currentColor" />
    <circle cx="24" cy="25.5" r="2.6" fill="currentColor" />
    </svg>
}