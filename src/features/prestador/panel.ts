/** Tope de servicios publicados por prestador (ValidacionesServicio.MAX_SERVICIOS en Android). */
export const MAX_SERVICIOS = 2
export const FOTOS_META = 3

export function puedePublicarMas(publicados: number): boolean {
  return publicados < MAX_SERVICIOS
}

export interface PasoPerfil {
  texto: string
  hecho: boolean
}

/** «Completa tu perfil»: lo que falta para que el perfil dé confianza. */
export function pasosPerfil(publicados: number, fotos: number): PasoPerfil[] {
  return [
    { texto: 'Publica tu primer servicio', hecho: publicados > 0 },
    { texto: `Sube ${FOTOS_META} fotos de tus trabajos`, hecho: fotos >= FOTOS_META },
  ]
}

export function porcentajePerfil(pasos: PasoPerfil[]): number {
  return pasos.length === 0 ? 0 : Math.round((pasos.filter((p) => p.hecho).length / pasos.length) * 100)
}

export function textoPorResponder(n: number): string {
  return n > 0 ? `Tienes ${n} por responder.` : 'Aquí aparecen las personas que te piden un servicio.'
}
