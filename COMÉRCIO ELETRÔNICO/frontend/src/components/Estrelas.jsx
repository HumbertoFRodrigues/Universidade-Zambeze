import '../styles/seletor.css'

// Mostra a nota de 1 a 5 em estrelas
export function Estrelas({ nota }) {
    const cheias = Math.round(nota)
    return <span className="estrelas" aria-label={`Nota ${nota} de 5`}>
    {'★'.repeat(cheias)}<span className="estrelas-vazias">{'★'.repeat(5 - cheias)}</span>
    </span>
}