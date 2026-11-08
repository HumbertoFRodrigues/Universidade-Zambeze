import { useState } from 'react'
import { cotacoesApi } from '../services/api.js'

// Converte texto "SKU, quantidade" (uma linha por produto; separador vírgula, ponto e vírgula
// ou tabulação). Ignora linhas vazias e um cabeçalho na primeira linha (ex.: "sku;quantidade").
export function lerLinhasSku(texto) {
  return String(texto || '')
    .split(/\r?\n/)
    .map(linha => linha.trim())
    .filter(Boolean)
    .map(linha => linha.split(/[;,\t]/).map(parte => parte.trim()))
    .filter((partes, indice) => !(indice === 0 && /sku|c[oó]digo/i.test(partes[0]) && !/^\d+$/.test(partes[1] || '')))
    .map(([sku = '', quantidade = '']) => ({ sku, quantidade: quantidade === '' ? null : Number(quantidade) }))
}

// Encomenda rápida por SKU para empresas: a validação é feita no servidor (SKU, quantidade,
// stock) e as linhas válidas são juntadas ao pedido de cotação.
export function EncomendaRapidaSku({ aoAdicionar }) {
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState({ aValidar: false, erro: '', resultado: null })

  const importar = async evento => {
    const ficheiro = evento.target.files?.[0]
    evento.target.value = ''
    if (!ficheiro) return
    if (ficheiro.size > 200000) return setEstado({ aValidar: false, erro: 'O ficheiro CSV é demasiado grande (máximo 200 KB).', resultado: null })
    setTexto(await ficheiro.text())
  }

  const validar = async () => {
    const linhas = lerLinhasSku(texto)
    if (!linhas.length) return setEstado({ aValidar: false, erro: 'Escreva pelo menos uma linha "SKU, quantidade".', resultado: null })
    setEstado({ aValidar: true, erro: '', resultado: null })
    try {
      const resultado = await cotacoesApi.validarSku(linhas)
      setEstado({ aValidar: false, erro: '', resultado })
      const validas = resultado.linhas.filter(linha => linha.valida)
      if (validas.length) aoAdicionar(validas.map(linha => ({ produto: linha.produto, quantidade: linha.quantidade })))
      // Mantém no texto só as linhas com erro, para serem corrigidas.
      const comErro = resultado.linhas.filter(linha => !linha.valida).map(linha => `${linha.sku}, ${linha.quantidade ?? ''}`)
      setTexto(comErro.join('\n'))
    } catch (error) {
      setEstado({ aValidar: false, erro: error.message, resultado: null })
    }
  }

  const { resultado } = estado
  return <details className="larga encomenda-sku">
    <summary>Encomenda rápida por SKU</summary>
    <p className="nota">Uma linha por produto: <code>SKU, quantidade</code> (por exemplo <code>SEED-ES-0003, 50</code>). Também pode importar um ficheiro CSV.</p>
    <textarea aria-label="Linhas SKU e quantidade" rows={5} value={texto} onChange={e => setTexto(e.target.value)} placeholder={'SEED-ES-0003, 50\nSEED-ES-0024, 120'} />
    <div className="botoes">
      <label className="botao botao-claro botao-pequeno">Importar CSV<input type="file" accept=".csv,text/csv,text/plain" hidden onChange={importar} /></label>
      <button type="button" className="botao botao-pequeno" disabled={estado.aValidar} onClick={validar}>{estado.aValidar ? 'A validar…' : 'Validar e adicionar'}</button>
    </div>
    {estado.erro && <p className="erro" role="alert">{estado.erro}</p>}
    {resultado && <div role="status">
      <p className="nota">{resultado.validas} linha(s) adicionada(s) ao pedido{resultado.invalidas ? `, ${resultado.invalidas} com erro (ficaram no texto para corrigir)` : ''}.</p>
      {resultado.invalidas > 0 && <ul className="erros-sku">
        {resultado.linhas.filter(linha => !linha.valida).map(linha => <li key={linha.linha}>Linha {linha.linha} ({linha.sku || 'sem SKU'}): {linha.erro}</li>)}
      </ul>}
    </div>}
  </details>
}
