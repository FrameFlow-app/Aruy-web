import { ErrorApi, peticion } from '../../api/api'
import type { RespuestaAuth } from '../../api/tipos'

// Endpoints del prestador. Viven aquí (y no en api/endpoints.ts) para no pisar otros cambios.

export interface DatosActivar {
  oficio_principal: string
  zona_cobertura: string
  descripcion_profesional?: string
  anios_experiencia?: number
}

/** Convierte esta cuenta CONTRATANTE en prestador. Responde con un token NUEVO (rol PRESTADOR). */
export const activarPerfil = (datos: DatosActivar) =>
  peticion<RespuestaAuth>('/perfiles/activar', { metodo: 'POST', cuerpo: datos })

export type TipoPlan = 'ARUY_PRO_SEMANAL' | 'ARUY_PRO_MENSUAL'
export type EstadoSuscripcion = 'ACTIVA' | 'PENDIENTE' | 'CANCELADA' | 'VENCIDA'

export interface Suscripcion {
  id: string
  prestador_id?: string | null
  tipo_plan: TipoPlan | string
  estado: EstadoSuscripcion | string
  fecha_inicio: string | null
  fecha_fin: string | null
  renovacion_automatica: boolean
  /** El backend marca con true las suscripciones sin pago real. */
  simulada?: boolean
}

/** Mi suscripción más reciente; null si nunca tuvo (el servidor responde 404). */
export async function miSuscripcion(): Promise<Suscripcion | null> {
  try {
    return await peticion<Suscripcion>('/suscripciones/mia')
  } catch (e) {
    if (e instanceof ErrorApi && e.estado === 404) return null
    throw e
  }
}

export const suscribirse = (tipo: TipoPlan, renovacionAutomatica: boolean) =>
  peticion<Suscripcion>('/suscripciones', {
    metodo: 'POST',
    cuerpo: { tipo_plan: tipo, renovacion_automatica: renovacionAutomatica },
  })

export const cancelarSuscripcion = (id: string) =>
  peticion<Suscripcion>(`/suscripciones/${encodeURIComponent(id)}/cancelar`, { metodo: 'PATCH' })
