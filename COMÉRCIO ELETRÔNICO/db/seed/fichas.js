// Descrição completa e ficha técnica por nome de produto (igual ao de catalogo.js).
// Valores conservadores; nos modelos reais seguem as especificações publicadas pelo fabricante.
import { fichasEpi } from './fichas/epi.js'
import { fichasSeguranca } from './fichas/seguranca.js'
import { fichasRedes } from './fichas/redes.js'

export const fichas = { ...fichasEpi, ...fichasSeguranca, ...fichasRedes }
