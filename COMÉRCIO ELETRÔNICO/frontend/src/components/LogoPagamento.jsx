import '../styles/pagamento-logos.css'

const LOGOS = {
  mpesa: { src: '/imagens/pagamentos/mpesa.png', nome: 'M-Pesa' },
  emola: { src: '/imagens/pagamentos/emola.png', nome: 'e-Mola' },
  cartao: { src: '/imagens/pagamentos/cartao.png', nome: 'Visa e Mastercard' },
  banco: { src: '/imagens/pagamentos/banco.svg', nome: 'Transferência' },
  numerario: { src: '/imagens/pagamentos/numerario.svg', nome: 'Numerário' },
}

export function LogoPagamento({ id }) {
  const logo = LOGOS[id]
  if (!logo) return <span className="selo">{id}</span>
  return <img className="logo-pagamento" src={logo.src} alt={logo.nome} />
}
