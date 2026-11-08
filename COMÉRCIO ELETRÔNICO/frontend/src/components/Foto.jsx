import { useState } from 'react'
import '../styles/foto.css'

const extensoes = ['jpg', 'jpeg', 'png', 'webp']

// Procura a foto da cor escolhida, a foto geral do produto e, por fim, a imagem do backend.
// Os ficheiros podem ser .jpg, .jpeg, .png ou .webp. Se não existir nenhum, mostra um espaço neutro.
export function caminhosFoto(produto, cor, indice = 0) {
  const bases = [`${produto.slug}-${cor || 'base'}-${indice + 1}`, `${produto.slug}-${indice + 1}`]
  const fotos = bases.flatMap(b => extensoes.map(e => `/imagens/produtos/${b}.${e}`))
  return [...fotos, produto.imagens?.[indice]?.url].filter(Boolean)
}

export function Foto({ produto, cor, indice = 0 }) {
  const [falhou, setFalhou] = useState({})
  const url = caminhosFoto(produto, cor, indice).find(u => !falhou[u])

  if (!url) return <div className="foto-vazia" role="img" aria-label={produto.nome} />
  return <img className="foto" src={url} alt={produto.nome} onError={() => setFalhou({ ...falhou, [url]: true })} />
}