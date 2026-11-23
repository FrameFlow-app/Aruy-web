import type { Rol } from '../../api/tipos'
import { rutaVolverSegura } from '../../pages/cuenta/volver'

export const RUTA_PANEL = '/panel'
export const RUTA_INICIO = '/inicio'

/** Primera pantalla tras entrar: el prestador cae en su Panel; el resto, en Inicio. */
export function rutaInicial(rol: Rol | null | undefined): string {
  return rol === 'PRESTADOR' ? RUTA_PANEL : RUTA_INICIO
}

/** Destino tras login, registro o activar: `?volver=` si es seguro; si no, la ruta inicial del rol. */
export function destinoTrasAcceso(rol: Rol | null | undefined, volver: string | null | undefined): string {
  return rutaVolverSegura(volver, rutaInicial(rol))
}
