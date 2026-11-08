export function formatarDinheiro(centavos) {
  return (centavos / 100).toFixed(2)
}

export function paraCentavos(valor) {
  return Math.round(Number(valor) * 100)
}
