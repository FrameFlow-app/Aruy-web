import type { Rol } from '../../api/tipos'

/**
 * A dónde mandar a quien intenta entrar a una ruta pensada para `requerido`.
 * Devuelve null si puede pasar. Sin sesión va a Ingresar y regresa a donde estaba.
 */
export function redireccionPorRol(rol: Rol | null | undefined, requerido: Rol, ubicacion: string): string | null {
  if (!rol) return `/ingresar?volver=${encodeURIComponent(ubicacion)}`
  if (rol === requerido) return null
  return requerido === 'PRESTADOR' ? '/inicio' : '/panel'
}
