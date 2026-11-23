export const ANIOS_MAX = 80

/** «» -> sin dato; «0» a «80» -> número; otra cosa -> error. */
export function validarAnios(texto: string): { valor: number | null; error: string | null } {
  const limpio = texto.trim()
  if (!limpio) return { valor: null, error: null }
  if (!/^\d{1,2}$/.test(limpio) || Number(limpio) > ANIOS_MAX) {
    return { valor: null, error: `Escribe un número entre 0 y ${ANIOS_MAX}, o déjalo vacío.` }
  }
  return { valor: Number(limpio), error: null }
}
