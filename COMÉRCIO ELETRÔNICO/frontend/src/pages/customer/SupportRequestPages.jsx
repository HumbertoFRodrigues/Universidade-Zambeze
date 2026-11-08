import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ContaCabecalho, FuncionalidadeIndisponivel } from '../../components/conta/ContaLayout.jsx'
import { ContactosLoja } from '../../components/conta/ContactosLoja.jsx'
import { EstadoConta, ResultadoConta } from '../../components/conta/ResultadoConta.jsx'
import { useDadosConta } from '../../hooks/useDadosConta.js'
import { contaApi } from '../../services/api.js'
import { ESTADOS_PEDIDO, mensagemDeErro, validarCodigoEncomenda } from '../../services/cliente.js'
import { dataLegivel } from '../../lib/format.js'

// Garantias, reclamações e assistência são registos da tabela "pedido_assistencia"
// (tipo_pedido GARANTIA, RECLAMACAO ou DUVIDA), via /conta/pedidos-assistencia.
const TIPOS = {
  garantias: {
    tipoPedido: 'GARANTIA',
    plural: 'Garantias',
    descricao: 'Pedidos de garantia dos produtos que comprou.',
    singular: 'pedido de garantia',
    detalhe: 'Detalhe da garantia',
    voltar: 'Voltar às garantias',
    novo: 'Pedir garantia',
  },
  reclamacoes: {
    tipoPedido: 'RECLAMACAO',
    plural: 'Reclamações',
    descricao: 'Reclamações que apresentou à loja.',
    singular: 'pedido de reclamação',
    detalhe: 'Detalhe da reclamação',
    voltar: 'Voltar às reclamações',
    novo: 'Nova reclamação',
  },
  assistencia: {
    tipoPedido: 'DUVIDA',
    plural: 'Assistência',
    descricao: 'Pedidos de ajuda e dúvidas enviados à loja.',
    singular: 'pedido de assistência',
    detalhe: 'Detalhe do pedido de assistência',
    voltar: 'Voltar à assistência',
    novo: 'Novo pedido',
  },
}

function criarPaginas(secao) {
  const { tipoPedido, plural, descricao, singular, detalhe, voltar: rotuloVoltar, novo } = TIPOS[secao]
  const base = `/conta/${secao}`
  const voltar = { to: base, rotulo: rotuloVoltar }
  const botaoVoltar = <Link className="botao botao-claro botao-pequeno" to={base}>{voltar.rotulo}</Link>

  function Lista() {
    const { data, error, loading, recarregar } = useDadosConta(opcoes => contaApi.pedidos(tipoPedido, opcoes), `pedidos-${tipoPedido}`)
    const pedidos = data?.pedidos || []
    return <>
      <ContaCabecalho
        titulo={plural}
        descricao={descricao}
        accao={<Link className="botao botao-claro botao-pequeno" to={`${base}/nova`}>{novo}</Link>}
      />
      <ResultadoConta loading={loading} error={error} recarregar={recarregar} mensagem="A carregar pedidos…"
        vazio={data && !pedidos.length && `Ainda não fez nenhum ${singular}.`}>
        <div className="conta-bloco">
          <dl className="conta-dados">
            {pedidos.map(p => (
              <div key={p.id}>
                <dt><Link to={`${base}/${p.id}`}>{p.assunto}</Link>{p.encomenda && <><br /><small className="suave">Encomenda {p.encomenda.codigoEncomenda}</small></>}</dt>
                <dd><EstadoConta valor={p.estado} rotulos={ESTADOS_PEDIDO} /></dd>
              </div>
            ))}
          </dl>
        </div>
      </ResultadoConta>
    </>
  }

  function Novo() {
    const navigate = useNavigate()
    const [campos, setCampos] = useState({ assunto: '', mensagem: '', codigoEncomenda: '' })
    const [envio, setEnvio] = useState({ aEnviar: false, erro: '' })
    const encomendaObrigatoria = tipoPedido === 'GARANTIA'

    const submeter = async e => {
      e.preventDefault()
      if (!campos.assunto.trim() || !campos.mensagem.trim()) return setEnvio({ aEnviar: false, erro: 'Indique o assunto e a mensagem.' })
      const codigo = campos.codigoEncomenda.trim()
      if (encomendaObrigatoria && !codigo) return setEnvio({ aEnviar: false, erro: 'Indique o código da encomenda do produto.' })
      if (codigo && validarCodigoEncomenda(codigo)) return setEnvio({ aEnviar: false, erro: validarCodigoEncomenda(codigo) })
      setEnvio({ aEnviar: true, erro: '' })
      try {
        const { pedido } = await contaApi.criarPedido({
          tipoPedido, assunto: campos.assunto.trim(), mensagem: campos.mensagem.trim(), codigoEncomenda: codigo || undefined,
        })
        navigate(`${base}/${pedido.id}`)
      } catch (error) {
        setEnvio({ aEnviar: false, erro: mensagemDeErro(error) })
      }
    }

    return <>
      <ContaCabecalho titulo={novo} voltar={voltar} />
      <form className="conta-bloco conta-form" onSubmit={submeter} noValidate>
        <div className="conta-campo">
          <label htmlFor="pedido-encomenda">Código da encomenda{encomendaObrigatoria ? '' : ' (opcional)'}</label>
          <input id="pedido-encomenda" maxLength={20} placeholder="Por exemplo, ENC-1A2B3C4D5E6F7A8B" value={campos.codigoEncomenda} onChange={e => setCampos({ ...campos, codigoEncomenda: e.target.value })} />
        </div>
        <div className="conta-campo">
          <label htmlFor="pedido-assunto">Assunto</label>
          <input id="pedido-assunto" maxLength={150} value={campos.assunto} onChange={e => setCampos({ ...campos, assunto: e.target.value })} />
        </div>
        <div className="conta-campo">
          <label htmlFor="pedido-mensagem">Mensagem</label>
          <textarea id="pedido-mensagem" maxLength={5000} value={campos.mensagem} onChange={e => setCampos({ ...campos, mensagem: e.target.value })} />
        </div>
        {envio.erro && <p className="erro" role="alert">{envio.erro}</p>}
        <div className="conta-links">
          <button className="botao botao-laranja" type="submit" disabled={envio.aEnviar}>{envio.aEnviar ? 'A enviar…' : 'Enviar pedido'}</button>
          {botaoVoltar}
        </div>
      </form>
      <ContactosLoja />
    </>
  }

  function Detalhe() {
    const { id } = useParams()
    const valido = /^\d+$/.test(id || '')
    const { data, error, loading, recarregar } = useDadosConta(
      opcoes => (valido ? contaApi.pedido(id, opcoes) : Promise.resolve(null)), `pedido-${id}`,
    )
    return <>
      <ContaCabecalho titulo={detalhe} voltar={voltar} />
      {valido
        ? <ResultadoConta loading={loading} error={error} recarregar={recarregar} mensagem="A carregar o pedido…">
            {data && <div className="conta-bloco">
              <dl className="conta-dados">
                <div><dt>Assunto</dt><dd>{data.pedido.assunto}</dd></div>
                <div><dt>Estado</dt><dd><EstadoConta valor={data.pedido.estado} rotulos={ESTADOS_PEDIDO} /></dd></div>
                {data.pedido.encomenda && <div><dt>Encomenda</dt><dd><Link to={`/conta/encomendas/${encodeURIComponent(data.pedido.encomenda.codigoEncomenda)}`}>{data.pedido.encomenda.codigoEncomenda}</Link></dd></div>}
                <div><dt>Mensagem</dt><dd style={{ whiteSpace: 'pre-line' }}>{data.pedido.mensagem}</dd></div>
                <div><dt>Resposta da loja</dt><dd style={{ whiteSpace: 'pre-line' }}>{data.pedido.resposta || 'Ainda sem resposta.'}</dd></div>
                {data.pedido.respondidoEm && <div><dt>Respondido em</dt><dd>{dataLegivel(data.pedido.respondidoEm)}</dd></div>}
              </dl>
            </div>}
          </ResultadoConta>
        : <FuncionalidadeIndisponivel titulo="Pedido inválido" accao={botaoVoltar}>
            O identificador indicado não corresponde a um pedido válido.
          </FuncionalidadeIndisponivel>}
    </>
  }

  return { Lista, Novo, Detalhe }
}

const garantias = criarPaginas('garantias')
const reclamacoes = criarPaginas('reclamacoes')
const assistencia = criarPaginas('assistencia')

export const WarrantiesPage = garantias.Lista
export const NewWarrantyPage = garantias.Novo
export const WarrantyDetailPage = garantias.Detalhe
export const ComplaintsPage = reclamacoes.Lista
export const NewComplaintPage = reclamacoes.Novo
export const ComplaintDetailPage = reclamacoes.Detalhe
export const SupportPage = assistencia.Lista
export const NewSupportPage = assistencia.Novo
export const SupportDetailPage = assistencia.Detalhe
