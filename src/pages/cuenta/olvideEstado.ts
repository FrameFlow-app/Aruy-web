// Para que recargar la pantalla de «Olvidé mi contraseña» no pierda el paso ni el correo (como Android al
// recrear la pantalla). NUNCA se guarda el código ni la contraseña.
const CLAVE = 'aruy.olvide'

export type PasoOlvide = 'correo' | 'codigo'

export interface EstadoOlvide {
  paso: PasoOlvide
  email: string
}

export function guardarOlvide(estado: EstadoOlvide): void {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify({ paso: estado.paso, email: estado.email }))
  } catch {
    // sin almacenamiento: se pierde solo la comodidad de recargar
  }
}

export function leerOlvide(): EstadoOlvide | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE)
    if (!crudo) return null
    const v = JSON.parse(crudo) as Partial<EstadoOlvide> | null
    if (!v || (v.paso !== 'correo' && v.paso !== 'codigo') || typeof v.email !== 'string') return null
    return { paso: v.paso, email: v.email }
  } catch {
    return null
  }
}

export function limpiarOlvide(): void {
  try {
    sessionStorage.removeItem(CLAVE)
  } catch {
    // nada que borrar
  }
}

/**
 * Estado con el que arranca la pantalla. Si venías de Ingresar con otro correo escrito, manda ese y se empieza
 * de cero; si no, se retoma lo guardado.
 */
export function estadoInicialOlvide(correoPrevio: string): EstadoOlvide {
  const guardado = leerOlvide()
  const previo = correoPrevio.trim()
  if (guardado && (!previo || previo.toLowerCase() === guardado.email.trim().toLowerCase())) return guardado
  return { paso: 'correo', email: correoPrevio }
}
