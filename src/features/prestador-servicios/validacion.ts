// Reglas del formulario de servicio. Mismas que la app Android (ValidacionesServicio.kt) y el backend.

export const TITULO_MAX = 60
export const DESCRIPCION_MAX = 500
export const PRECIO_MAX = 10_000
export const FOTOS_MIN = 1
export const MAX_FOTOS = 3
export const MAX_SERVICIOS = 2

export const AVISO_MAX_SERVICIOS = `Puedes tener hasta ${MAX_SERVICIOS} servicios. Elimina uno para publicar otro.`

function letras(texto: string): number {
  return (texto.match(/\p{L}/gu) ?? []).length
}

export function validarTitulo(valor: string): string | null {
  if (valor.trim().length > TITULO_MAX) return `Usa máximo ${TITULO_MAX} letras.`
  return letras(valor) >= 4 ? null : 'Escribe un título de al menos 4 letras.'
}

export function validarDescripcion(valor: string): string | null {
  if (valor.trim().length > DESCRIPCION_MAX) return `Usa máximo ${DESCRIPCION_MAX} caracteres.`
  return letras(valor) >= 20 ? null : 'Cuenta un poco más: escribe al menos 20 letras.'
}

export function validarFotos(total: number): string | null {
  return total >= FOTOS_MIN ? null : 'Agrega al menos una foto de tu trabajo para publicar el servicio.'
}

export function validarCategoria(valor: string | null): string | null {
  return valor ? null : 'Elige la categoría del servicio.'
}

export interface ResultadoPrecio {
  valor: number | null
  error: string | null
}

/** El precio es opcional (vacío = «a convenir»); si se escribe debe ser mayor que 0 y menor que 10 000. */
export function validarPrecio(texto: string): ResultadoPrecio {
  const limpio = texto.trim().replace(',', '.')
  if (limpio === '') return { valor: null, error: null }
  const valido = /^(\d+(\.\d*)?|\.\d+)$/.test(limpio)
  const numero = valido ? Number(limpio) : NaN
  if (numero > 0 && numero < PRECIO_MAX) return { valor: numero, error: null }
  return { valor: null, error: 'Escribe un precio válido. Ejemplo: 15 o 12,50.' }
}

/** «LIMPIEZA DE CASAS» -> «Limpieza de casas»: igual que el servidor (validar.js). */
export function normalizarTitulo(titulo: string | null | undefined): string {
  const limpio = String(titulo ?? '').trim().replace(/\s+/g, ' ')
  if (limpio === '') return limpio
  const minusculas = limpio.toLocaleLowerCase('es')
  return minusculas.charAt(0).toLocaleUpperCase('es') + minusculas.slice(1)
}

export interface Cupo {
  /** Cuántos se pueden agregar todavía. */
  restante: number
  lleno: boolean
}

export function cupoServicios(actuales: number): Cupo {
  const restante = Math.max(0, MAX_SERVICIOS - actuales)
  return { restante, lleno: restante === 0 }
}

/** Fotos guardadas en el servicio más las nuevas que esperan subirse. */
export function cupoFotos(guardadas: number, nuevas = 0): Cupo {
  const restante = Math.max(0, MAX_FOTOS - guardadas - nuevas)
  return { restante, lleno: restante === 0 }
}

export function textoFotos(total: number): string {
  return `${total} ${total === 1 ? 'foto' : 'fotos'}`
}
