import type { Usuario } from './tipos'

// Sin refresh token: el JWT dura 30 dias y se renueva con POST /auth/renovar.
const CLAVE = 'aruy.sesion'
const UN_DIA_S = 24 * 60 * 60

export interface Sesion {
  token: string
  usuario: Usuario
  perfilPrestadorId: string | null
  /** Momento (ms) en que se guardo el token en este dispositivo. */
  guardadoEn: number
}

export function guardarSesion(sesion: Omit<Sesion, 'guardadoEn'> & { guardadoEn?: number }): Sesion {
  const completa: Sesion = { ...sesion, guardadoEn: sesion.guardadoEn ?? Date.now() }
  try {
    localStorage.setItem(CLAVE, JSON.stringify(completa))
  } catch {
    // Almacenamiento lleno o bloqueado: la sesion vive solo en memoria.
  }
  return completa
}

export function leerSesion(): Sesion | null {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return null
    const s = JSON.parse(crudo) as Partial<Sesion>
    if (typeof s.token !== 'string' || !s.usuario) return null
    return {
      token: s.token,
      usuario: s.usuario,
      perfilPrestadorId: s.perfilPrestadorId ?? null,
      guardadoEn: typeof s.guardadoEn === 'number' ? s.guardadoEn : 0,
    }
  } catch {
    return null
  }
}

export function borrarSesion(): void {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    // nada que borrar
  }
}

export interface CargaToken {
  iat?: number
  exp?: number
}

/** Lee el payload del JWT sin verificar la firma (solo para decidir si renovar). */
export function decodificarToken(token: string): CargaToken | null {
  const partes = token.split('.')
  if (partes.length !== 3) return null
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    const relleno = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const bytes = Uint8Array.from(atob(relleno), (c) => c.charCodeAt(0))
    const json = JSON.parse(new TextDecoder().decode(bytes)) as CargaToken
    return typeof json === 'object' && json !== null ? json : null
  } catch {
    return null
  }
}

/**
 * true si hay que pedir un token nuevo: ya paso mas de un dia desde que se emitio.
 * Un token vencido o ilegible no se renueva (el servidor lo rechazaria): hay que volver a ingresar.
 */
export function debeRenovar(token: string, ahoraMs: number = Date.now()): boolean {
  const carga = decodificarToken(token)
  if (!carga || typeof carga.iat !== 'number') return false
  const ahora = ahoraMs / 1000
  if (typeof carga.exp === 'number' && carga.exp <= ahora) return false
  return ahora - carga.iat > UN_DIA_S
}

export function tokenVencido(token: string, ahoraMs: number = Date.now()): boolean {
  const carga = decodificarToken(token)
  if (!carga || typeof carga.exp !== 'number') return false
  return carga.exp <= ahoraMs / 1000
}

/** Evento global que se emite cuando el servidor responde 401: la app lleva a Ingresar. */
export const EVENTO_SESION_EXPIRADA = 'aruy:sesion-expirada'
