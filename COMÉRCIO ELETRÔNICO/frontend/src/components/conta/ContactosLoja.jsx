import { usePublicInfo } from '../../hooks/usePublicInfo.js'

// Contactos reais da loja (configuracao_loja), como alternativa enquanto o
// pedido não pode ser registado online. Não mostra nada se não houver dados.
export function ContactosLoja({ titulo = 'Contactar a loja' }) {
  const { configuracao, loading } = usePublicInfo()
  if (loading || !configuracao) return null

  const contactos = [
    ['Telefone', configuracao.telefone, configuracao.telefone && `tel:${configuracao.telefone.replace(/\s+/g, '')}`],
    ['Email', configuracao.email, configuracao.email && `mailto:${configuracao.email}`],
    ['Horário de atendimento', configuracao.horarioAtendimento],
  ].filter(([, valor]) => valor)
  if (contactos.length === 0) return null

  return <div className="conta-bloco">
    <h2>{titulo}</h2>
    <dl className="conta-dados">
      {contactos.map(([etiqueta, valor, href]) => (
        <div key={etiqueta}><dt>{etiqueta}</dt><dd>{href ? <a className="link" href={href}>{valor}</a> : valor}</dd></div>
      ))}
    </dl>
  </div>
}
