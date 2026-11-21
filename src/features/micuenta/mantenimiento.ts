import type { Avisos } from '../../api/tipos'

/** Mínimo entre consultas de /avisos al volver a la pestaña. */
export const INTERVALO_AVISOS_MS = 10 * 60 * 1000

export const MENSAJE_MANTENIMIENTO_POR_DEFECTO = 'Estamos mejorando Aruy. Vuelve en unos minutos.'

function aMs(valor: string | null | undefined): number | null {
  if (!valor) return null
  const t = Date.parse(valor)
  return Number.isNaN(t) ? null : t
}

/** Hay aviso activo y, si trae inicio o fin, `ahora` cae dentro del rango. */
export function debeMostrarMantenimiento(avisos: Avisos | null | undefined, ahora: Date | number = Date.now()): boolean {
  const m = avisos?.mantenimiento
  if (!m || !m.activo) return false
  const t = typeof ahora === 'number' ? ahora : ahora.getTime()
  const inicio = aMs(m.inicio)
  const fin = aMs(m.fin)
  if (inicio !== null && t < inicio) return false
  if (fin !== null && t > fin) return false
  return true
}

/** ¿Ya pasó el tiempo mínimo desde la última consulta? */
export function tocaConsultar(ultima: number | null, ahora: number, minimo = INTERVALO_AVISOS_MS): boolean {
  return ultima === null || ahora - ultima >= minimo
}

function formato(ms: number): string {
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Guayaquil',
  }).format(ms)
}

/** "Desde el 5 de marzo de 2026, 20:00 hasta el 6 de marzo de 2026, 02:00", o solo una de las dos partes. */
export function describirIntervalo(inicio: string | null | undefined, fin: string | null | undefined): string | null {
  const i = aMs(inicio)
  const f = aMs(fin)
  if (i !== null && f !== null) return `Desde el ${formato(i)} hasta el ${formato(f)}.`
  if (i !== null) return `Desde el ${formato(i)}.`
  if (f !== null) return `Hasta el ${formato(f)}.`
  return null
}
