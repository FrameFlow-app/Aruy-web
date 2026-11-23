import type { EstadoSuscripcion, Suscripcion, TipoPlan } from './api'

export interface Plan {
  tipo: TipoPlan
  titulo: string
  dias: number
  descripcion: string
}

/** Los dos planes que acepta el backend (PLANES en routes/suscripciones.js). Sin precios: no se cobra. */
export const PLANES: readonly Plan[] = [
  { tipo: 'ARUY_PRO_SEMANAL', titulo: 'Aruy Pro semanal', dias: 7, descripcion: 'Siete días para probarlo.' },
  { tipo: 'ARUY_PRO_MENSUAL', titulo: 'Aruy Pro mensual', dias: 30, descripcion: 'Treinta días seguidos.' },
]

export function planDe(tipo: string): Plan | undefined {
  return PLANES.find((p) => p.tipo === tipo)
}

const ETIQUETAS: Record<EstadoSuscripcion, string> = {
  ACTIVA: 'Activa',
  PENDIENTE: 'Pendiente',
  CANCELADA: 'Cancelada',
  VENCIDA: 'Vencida',
}

export function etiquetaEstado(estado: string): string {
  return ETIQUETAS[estado as EstadoSuscripcion] ?? estado
}

/** El servidor solo admite una suscripción PENDIENTE o ACTIVA a la vez; el historial no cuenta. */
export function puedeContratar(actual: Suscripcion | null | undefined): boolean {
  return !actual || actual.estado === 'CANCELADA' || actual.estado === 'VENCIDA'
}

export function puedeCancelar(actual: Suscripcion | null | undefined): boolean {
  return !!actual && (actual.estado === 'ACTIVA' || actual.estado === 'PENDIENTE')
}

/** «2026-10-25T12:00:00.000Z» -> «25 de octubre de 2026»; null si no se puede leer. */
export function fechaLarga(iso: string | null | undefined, zona?: string): string | null {
  if (!iso) return null
  const f = new Date(iso)
  if (Number.isNaN(f.getTime())) return null
  return f.toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric', timeZone: zona })
}
