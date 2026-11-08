import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ContaCabecalho, FuncionalidadeIndisponivel } from '../../components/conta/ContaLayout.jsx'
import { ResultadoConta } from '../../components/conta/ResultadoConta.jsx'
import { useDadosConta } from '../../hooks/useDadosConta.js'
import { checkoutApi, contaApi } from '../../services/api.js'
import { idValido, mensagemDeErro } from '../../services/cliente.js'

// Endereços da conta (tabela endereco), via /conta/enderecos.
const VOLTAR = { to: '/conta/enderecos', rotulo: 'Voltar aos endereços' }
const botaoVoltar = <Link className="botao botao-claro botao-pequeno" to={VOLTAR.to}>{VOLTAR.rotulo}</Link>

const moradaCompleta = e => [e.linhaEndereco, e.cidade, e.provincia].filter(Boolean).join(', ')

function EnderecoInvalido() {
  return <FuncionalidadeIndisponivel titulo="Endereço inválido" accao={botaoVoltar}>
    O identificador indicado não corresponde a um endereço válido.
  </FuncionalidadeIndisponivel>
}

export function AddressesPage() {
  const { data, error, loading, recarregar } = useDadosConta(opcoes => contaApi.enderecos(opcoes), 'enderecos')
  const enderecos = data?.enderecos || []
  return <>
    <ContaCabecalho
      titulo="Endereços"
      descricao="Moradas de entrega associadas à sua conta."
      accao={<Link className="botao botao-claro botao-pequeno" to="/conta/enderecos/novo">Novo endereço</Link>}
    />
    <ResultadoConta loading={loading} error={error} recarregar={recarregar} mensagem="A carregar endereços…"
      vazio={data && !enderecos.length && 'Ainda não guardou nenhum endereço.'}>
      {enderecos.map(e => (
        <div key={e.id} className="conta-bloco">
          <h2>{e.etiqueta || e.nomeDestinatario}{e.predefinido && <small className="suave"> · Predefinido</small>}</h2>
          <p>{e.nomeDestinatario} · {e.telefone}</p>
          <p className="suave">{moradaCompleta(e)} · Zona {e.zonaEntrega?.nome}</p>
          <div className="conta-links"><Link className="botao botao-claro botao-pequeno" to={`/conta/enderecos/${e.id}`}>Ver</Link></div>
        </div>
      ))}
    </ResultadoConta>
  </>
}

// Zonas com tarifas activas (as mesmas do checkout).
function useZonas() {
  const { data, error, loading } = useDadosConta(opcoes => checkoutApi.opcoesEntrega(opcoes), 'zonas')
  const zonas = useMemo(() => {
    const mapa = new Map()
    for (const opcao of data?.opcoes || []) mapa.set(opcao.zona.id, opcao.zona)
    return [...mapa.values()]
  }, [data])
  return { zonas, error, loading }
}

const CAMPOS = [
  ['etiqueta', 'Nome do endereço (opcional)', 50, false, 'Por exemplo, Casa ou Escritório'],
  ['nomeDestinatario', 'Destinatário', 150, true],
  ['telefone', 'Telefone', 30, true],
  ['linhaEndereco', 'Endereço (bairro, rua, número)', 255, true],
  ['cidade', 'Cidade', 100, true],
  ['provincia', 'Província', 100, true],
  ['pontoReferencia', 'Ponto de referência (opcional)', 255, false],
]

function FormularioEndereco({ inicial, aoGuardar, rotulo }) {
  const { zonas, error: erroZonas, loading: carregandoZonas } = useZonas()
  const [dados, setDados] = useState(() => ({
    etiqueta: '', nomeDestinatario: '', telefone: '', linhaEndereco: '', cidade: '', provincia: '', pontoReferencia: '',
    zonaEntregaId: '', predefinido: false,
    ...Object.fromEntries(Object.entries(inicial || {}).map(([k, v]) => [k, v ?? ''])),
  }))
  const [estado, setEstado] = useState({ aEnviar: false, erro: '' })

  const submeter = async e => {
    e.preventDefault()
    if (dados.zonaEntregaId === '') return setEstado({ aEnviar: false, erro: 'Escolha a zona de entrega.' })
    setEstado({ aEnviar: true, erro: '' })
    try {
      await aoGuardar({
        ...Object.fromEntries(CAMPOS.map(([campo]) => [campo, dados[campo].trim() || undefined])),
        zonaEntregaId: Number(dados.zonaEntregaId),
        predefinido: Boolean(dados.predefinido),
      })
    } catch (error) {
      setEstado({ aEnviar: false, erro: mensagemDeErro(error) })
    }
  }

  return <form className="conta-bloco conta-form" onSubmit={submeter}>
    {CAMPOS.map(([campo, rotuloCampo, max, obrigatorio, dica]) => (
      <div key={campo} className="conta-campo">
        <label htmlFor={`endereco-${campo}`}>{rotuloCampo}</label>
        <input id={`endereco-${campo}`} value={dados[campo]} maxLength={max} required={obrigatorio} placeholder={dica}
          onChange={e => setDados({ ...dados, [campo]: e.target.value })} />
      </div>
    ))}
    <div className="conta-campo">
      <label htmlFor="endereco-zona">Zona de entrega</label>
      {carregandoZonas
        ? <p className="suave" role="status">A carregar zonas…</p>
        : <select id="endereco-zona" required value={String(dados.zonaEntregaId)} onChange={e => setDados({ ...dados, zonaEntregaId: e.target.value })}>
            <option value="">Escolha a zona</option>
            {zonas.map(z => <option key={z.id} value={String(z.id)}>{z.nome}</option>)}
          </select>}
      {erroZonas && <p className="erro" role="alert">{erroZonas}</p>}
    </div>
    <label className="termos"><input type="checkbox" checked={Boolean(dados.predefinido)} onChange={e => setDados({ ...dados, predefinido: e.target.checked })} /> Usar como endereço predefinido</label>
    {estado.erro && <p className="erro" role="alert">{estado.erro}</p>}
    <div className="conta-links">
      <button className="botao botao-laranja" type="submit" disabled={estado.aEnviar}>{estado.aEnviar ? 'A guardar…' : rotulo}</button>
      {botaoVoltar}
    </div>
  </form>
}

export function NewAddressPage() {
  const navigate = useNavigate()
  return <>
    <ContaCabecalho titulo="Novo endereço" voltar={VOLTAR} />
    <FormularioEndereco rotulo="Guardar endereço" aoGuardar={async dados => {
      const { endereco } = await contaApi.criarEndereco(dados)
      navigate(`/conta/enderecos/${endereco.id}`)
    }} />
  </>
}

function ComEndereco({ children }) {
  const { id } = useParams()
  const valido = idValido(id) || id === '0'
  const { data, error, loading, recarregar } = useDadosConta(
    opcoes => (valido ? contaApi.endereco(id, opcoes) : Promise.resolve(null)), `endereco-${id}`,
  )
  if (!valido) return <EnderecoInvalido />
  return <ResultadoConta loading={loading} error={error} recarregar={recarregar} mensagem="A carregar o endereço…">
    {data && children(data.endereco)}
  </ResultadoConta>
}

export function AddressDetailPage() {
  const navigate = useNavigate()
  const [confirmar, setConfirmar] = useState(false)
  const [estado, setEstado] = useState({ aEnviar: false, erro: '' })
  return <>
    <ContaCabecalho titulo="Endereço" voltar={VOLTAR} />
    <ComEndereco>
      {endereco => {
        const apagar = async () => {
          setEstado({ aEnviar: true, erro: '' })
          try {
            await contaApi.apagarEndereco(endereco.id)
            navigate('/conta/enderecos')
          } catch (error) {
            setEstado({ aEnviar: false, erro: mensagemDeErro(error) })
          }
        }
        return <div className="conta-bloco">
          <dl className="conta-dados">
            {endereco.etiqueta && <div><dt>Nome</dt><dd>{endereco.etiqueta}</dd></div>}
            <div><dt>Destinatário</dt><dd>{endereco.nomeDestinatario} · {endereco.telefone}</dd></div>
            <div><dt>Morada</dt><dd>{moradaCompleta(endereco)}</dd></div>
            {endereco.pontoReferencia && <div><dt>Referência</dt><dd>{endereco.pontoReferencia}</dd></div>}
            <div><dt>Zona de entrega</dt><dd>{endereco.zonaEntrega?.nome}</dd></div>
            <div><dt>Predefinido</dt><dd>{endereco.predefinido ? 'Sim' : 'Não'}</dd></div>
          </dl>
          {estado.erro && <p className="erro" role="alert">{estado.erro}</p>}
          {confirmar
            ? <div className="conta-links">
                <span>Apagar este endereço?</span>
                <button type="button" className="botao botao-laranja botao-pequeno" disabled={estado.aEnviar} onClick={apagar}>{estado.aEnviar ? 'A apagar…' : 'Apagar'}</button>
                <button type="button" className="botao botao-claro botao-pequeno" onClick={() => setConfirmar(false)}>Cancelar</button>
              </div>
            : <div className="conta-links">
                <Link className="botao botao-claro botao-pequeno" to={`/conta/enderecos/${endereco.id}/editar`}>Editar</Link>
                <button type="button" className="botao botao-claro botao-pequeno" onClick={() => setConfirmar(true)}>Apagar</button>
              </div>}
        </div>
      }}
    </ComEndereco>
  </>
}

export function EditAddressPage() {
  const navigate = useNavigate()
  return <>
    <ContaCabecalho titulo="Editar endereço" voltar={VOLTAR} />
    <ComEndereco>
      {endereco => <FormularioEndereco
        inicial={{ ...endereco, zonaEntregaId: String(endereco.zonaEntregaId) }}
        rotulo="Guardar alterações"
        aoGuardar={async dados => {
          await contaApi.actualizarEndereco(endereco.id, dados)
          navigate(`/conta/enderecos/${endereco.id}`)
        }}
      />}
    </ComEndereco>
  </>
}
