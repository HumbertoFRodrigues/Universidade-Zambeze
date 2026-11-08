import { NavLink, useParams } from 'react-router-dom'
import { useApi } from '../hooks/useApi.js'
import { usePublicInfo } from '../hooks/usePublicInfo.js'
import { NotFoundPage } from './NotFoundPage.jsx'
import '../styles/info.css'

const MENU = [
  ['quem-somos', 'Quem somos'],
  ['contactos', 'Contactos'],
  ['perguntas-frequentes', 'Perguntas frequentes'],
  ['termos', 'Termos e condições'],
  ['entrega', 'Entrega'],
  ['devolucao', 'Devoluções e reembolso'],
  ['privacidade', 'Privacidade'],
  ['garantia', 'Garantia'],
]

const TIPOS = {
  privacidade: 'PRIVACIDADE',
  termos: 'TERMOS',
  entrega: 'ENTREGA',
  devolucao: 'DEVOLUCAO',
  garantia: 'GARANTIA',
}

const PERGUNTAS = [
  ['Que formas de pagamento aceitam?', 'M-Pesa, e-Mola, cartão Visa/Mastercard, transferência bancária e numerário na entrega (em zonas seleccionadas). No M-Pesa recebe um pedido no telemóvel e confirma com o seu PIN; nunca lhe pedimos o PIN no site.'],
  ['Preciso de criar conta para comprar?', 'Não. Se comprar sem conta, criamos uma automaticamente com o seu email para que possa acompanhar a encomenda. Pode alterar a palavra-passe depois.'],
  ['Quanto tempo demora a entrega?', 'Em Maputo e Matola, 1 a 2 dias úteis. Nas restantes capitais provinciais, 3 a 7 dias úteis. O custo e o prazo aparecem no checkout antes de pagar.'],
  ['Emitem factura com NUIT?', 'Sim. A factura é emitida automaticamente após a confirmação do pagamento, com IVA discriminado. Empresas podem indicar o NUIT na conta empresarial.'],
  ['Fazem preços especiais para empresas e grandes quantidades?', 'Sim. A partir de 10 unidades o desconto é aplicado automaticamente no carrinho. Para projectos (por exemplo, instalação de CCTV ou rede completa), peça uma cotação na página Empresas.'],
  ['Posso devolver um produto?', 'Sim, no prazo de 7 dias após a entrega, sem uso e na embalagem original. Por higiene, máscaras, filtros e tampões auditivos abertos não são aceites, salvo defeito. Veja a política de devoluções.'],
  ['Os equipamentos têm garantia?', 'Todos os produtos são novos e têm garantia legal: 12 meses para equipamento electrónico e de rede, 24 meses para cofres e fechaduras, e a garantia do fabricante para EPI.'],
  ['Fazem instalação de câmeras, alarmes ou redes?', 'A instalação é orçamentada à parte. Indique no pedido de cotação o local e o número de pontos e entramos em contacto.'],
]

// Converte o texto da política ("## " secção, "- " lista, linhas em branco) em elementos React, sem HTML.
function TextoPolitica({ conteudo }) {
  const blocos = []
  let lista = null
  let paragrafo = []
  const fecharParagrafo = () => { if (paragrafo.length) blocos.push(<p key={blocos.length}>{paragrafo.join(' ')}</p>); paragrafo = [] }
  const fecharLista = () => { if (lista) blocos.push(lista.ordenada ? <ol key={blocos.length}>{lista.itens}</ol> : <ul key={blocos.length}>{lista.itens}</ul>); lista = null }
  for (const linha of conteudo.split('\n').map(texto => texto.trim())) {
    const numerada = /^\d+\.\s/.test(linha)
    if (!linha) { fecharParagrafo(); fecharLista() } else if (linha.startsWith('## ')) {
      fecharParagrafo(); fecharLista(); blocos.push(<h2 key={blocos.length}>{linha.slice(3)}</h2>)
    } else if (linha.startsWith('- ') || numerada) {
      fecharParagrafo()
      if (!lista || lista.ordenada !== numerada) { fecharLista(); lista = { ordenada: numerada, itens: [] } }
      lista.itens.push(<li key={lista.itens.length}>{linha.replace(/^(-|\d+\.)\s/, '')}</li>)
    } else { fecharLista(); paragrafo.push(linha) }
  }
  fecharParagrafo(); fecharLista()
  return <>{blocos}</>
}

export function InfoPage() {
  const { pagina } = useParams()
  const { data, error, loading } = useApi('/politicas')
  const { configuracao, loading: carregandoConfiguracao } = usePublicInfo()
  if (!MENU.some(([id]) => id === pagina)) return <NotFoundPage />

  const politica = data?.politicas?.find(item => item.tipoPolitica === TIPOS[pagina])
  const titulo = politica?.titulo || MENU.find(([id]) => id === pagina)?.[1]

  return <section className="info">
    <nav className="info-menu" aria-label="Informações">
      <h2>Informações</h2>
      {MENU.map(([id, nome]) => <NavLink key={id} to={'/info/' + id}>{nome}</NavLink>)}
    </nav>

    <article className="info-texto">
      <h1>{titulo}</h1>
      {(loading || carregandoConfiguracao) && <p role="status">A carregar informação…</p>}
      {error && <p className="erro" role="alert">{error}</p>}
      {politica && <TextoPolitica conteudo={politica.conteudo} />}
      {politica?.actualizadoEm && <p className="info-actualizado">Versão {politica.versao || 1} · actualizada em {new Date(politica.actualizadoEm).toLocaleDateString('pt-MZ')}</p>}
      {pagina === 'quem-somos' && configuracao && <>
        <p>{configuracao.sobre || configuracao.nomeMarca}</p>
        <h2>O que fazemos</h2>
        <p>Fornecemos equipamento de segurança física e digital para casas, empresas, obras e instituições em Moçambique: equipamento de protecção individual, combate a incêndios, videovigilância, controlo de acessos, alarmes, cofres e protecção de redes e dados.</p>
        <h2>Porquê comprar connosco</h2>
        <ul>
          <li>Marcas reconhecidas: 3M, MSA, Honeywell, Hikvision, Dahua, Cisco, Fortinet, Ubiquiti, APC, Ajax, Yale e outras.</li>
          <li>Pagamento por M-Pesa, e-Mola, cartão, transferência ou na entrega.</li>
          <li>Entrega em 1 a 2 dias em Maputo e Matola e envio para todas as províncias.</li>
          <li>Factura com IVA, garantia em todos os produtos e preços para empresas.</li>
        </ul>
      </>}
      {pagina === 'contactos' && configuracao && (
        <dl className="dados">
          <div><dt>Vendedor</dt><dd>{configuracao.designacaoLegal || configuracao.nomeMarca}</dd></div>
          {configuracao.nuit && <div><dt>NUIT</dt><dd>{configuracao.nuit}</dd></div>}
          {configuracao.morada && <div><dt>Morada</dt><dd>{configuracao.morada}{configuracao.referenciaLocalizacao && <><br /><small>{configuracao.referenciaLocalizacao}</small></>}</dd></div>}
          {configuracao.telefone && <div><dt>Telefone</dt><dd><a href={`tel:${configuracao.telefone.replace(/\s/g, '')}`}>{configuracao.telefone}</a></dd></div>}
          {configuracao.regrasComerciais?.vendedor?.telefoneWhatsapp && <div><dt>WhatsApp</dt><dd><a href={`https://wa.me/${configuracao.regrasComerciais.vendedor.telefoneWhatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{configuracao.regrasComerciais.vendedor.telefoneWhatsapp}</a></dd></div>}
          {configuracao.email && <div><dt>Email</dt><dd><a href={`mailto:${configuracao.email}`}>{configuracao.email}</a></dd></div>}
          {configuracao.horarioAtendimento && <div><dt>Horário</dt><dd>{configuracao.horarioAtendimento}</dd></div>}
        </dl>
      )}
      {pagina === 'perguntas-frequentes' && <div className="info-faq">
        {PERGUNTAS.map(([pergunta, resposta]) => <details key={pergunta}><summary>{pergunta}</summary><p>{resposta}</p></details>)}
      </div>}
      {!loading && !carregandoConfiguracao && !politica && !['quem-somos', 'contactos', 'perguntas-frequentes'].includes(pagina) && (
        <p>Esta informação ainda não foi publicada pela loja.</p>
      )}
    </article>
  </section>
}
