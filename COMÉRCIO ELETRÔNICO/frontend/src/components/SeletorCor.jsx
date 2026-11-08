import '../styles/seletor.css'

// Bolinhas de cor. Ao clicar, avisa o componente de fora qual cor foi escolhida.
export function SeletorCor({ cores, atual, aoEscolher, grande = false }) {
    return <div className={grande ? 'cores cores-grandes' : 'cores'} role="group" aria-label="Cores">
    {cores.map(c => (
        <button
        key={c.id}
        type="button"
        className={`bolinha cor-${c.id}${c.id === atual ? ' ativa' : ''}`}
        onClick={() => aoEscolher(c.id)}
        aria-label={c.nome}
        aria-pressed={c.id === atual}
        title={c.nome}
        />
    ))}
    </div>
}