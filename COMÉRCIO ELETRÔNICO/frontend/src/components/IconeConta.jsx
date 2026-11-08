// Pessoa dentro de um círculo, para o link de entrada na conta
export function IconeConta({ tamanho = 28 }) {
  return <svg className="icone-conta" width={tamanho} height={tamanho} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <circle cx="16" cy="16" r="13" />
    <circle cx="16" cy="13" r="4.5" />
    <path d="M7.5 25.5c1.8-4 5-5.5 8.5-5.5s6.7 1.5 8.5 5.5" />
  </svg>
}