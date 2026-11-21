/**
 * Destino al que volver tras ingresar (`?volver=`). Solo rutas internas: cualquier otra cosa
 * (otro sitio, `//host`, `javascript:`, barras invertidas) se descarta para evitar un open redirect.
 */
export function rutaVolverSegura(valor: string | null | undefined, porDefecto = '/inicio'): string {
  if (!valor) return porDefecto
  if (!valor.startsWith('/') || valor.startsWith('//') || valor.startsWith('/\\')) return porDefecto
  // Barras invertidas y caracteres de control: algunos navegadores los tratan como '/'.
  // eslint-disable-next-line no-control-regex
  if (/[\\\u0000-\u001f\u007f]/.test(valor)) return porDefecto
  return valor
}
