import type { EstadoSolicitud, MensajeChat, MensajeLocal, Solicitud, TipoBandeja } from './tipos'

/**
 * Numero para wa.me: solo digitos con el 593 de Ecuador. Acepta `0991234567`, `+593 99 123 4567`,
 * `593991234567`. Devuelve null si no es un celular ecuatoriano valido (mismo criterio que el backend).
 */
export function normalizarWhatsapp(telefono: string | null | undefined): string | null {
  const d = String(telefono ?? '').replace(/\D/g, '')
  if (/^593\d{9}$/.test(d)) return d
  if (/^0\d{9}$/.test(d)) return `593${d.slice(1)}`
  return null
}

export function urlWhatsapp(telefono: string | null | undefined, saludo?: string): string | null {
  const numero = normalizarWhatsapp(telefono)
  if (!numero) return null
  return `https://wa.me/${numero}${saludo ? `?text=${encodeURIComponent(saludo)}` : ''}`
}

/** Estados a los que puede pasar una solicitud segun quien la mira (espejo de TRANSICIONES del backend). */
export function accionesPermitidas(estado: EstadoSolicitud, soyPrestador: boolean): EstadoSolicitud[] {
  if (soyPrestador) {
    if (estado === 'PENDIENTE') return ['ACEPTADA', 'RECHAZADA']
    if (estado === 'ACEPTADA') return ['COMPLETADA', 'CANCELADA']
    return []
  }
  return estado === 'PENDIENTE' || estado === 'ACEPTADA' ? ['CANCELADA'] : []
}

export function chatAbierto(estado: EstadoSolicitud): boolean {
  return estado !== 'RECHAZADA' && estado !== 'CANCELADA'
}

export function bandejaDe(soyPrestador: boolean): TipoBandeja {
  return soyPrestador ? 'recibidas' : 'enviadas'
}

// ---- Fechas ----

const MINUTO = 60_000
const HORA = 60 * MINUTO
const DIA = 24 * HORA

function aFecha(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const f = new Date(iso)
  return Number.isNaN(f.getTime()) ? null : f
}

function inicioDelDia(f: Date): number {
  return new Date(f.getFullYear(), f.getMonth(), f.getDate()).getTime()
}

/** Diferencia en dias de calendario (hora local) entre dos fechas. */
function diasEntre(antes: Date, despues: Date): number {
  return Math.round((inicioDelDia(despues) - inicioDelDia(antes)) / DIA)
}

/** «ahora», «hace 5 min», «hace 3 h», «ayer», «hace 4 días» o la fecha si pasó más de una semana. */
export function fechaRelativa(iso: string | null | undefined, ahora: number = Date.now()): string {
  const f = aFecha(iso)
  if (!f) return ''
  const dif = ahora - f.getTime()
  if (dif < MINUTO) return 'ahora'
  if (dif < HORA) return `hace ${Math.floor(dif / MINUTO)} min`
  const dias = diasEntre(f, new Date(ahora))
  if (dias <= 0) return `hace ${Math.floor(dif / HORA)} h`
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  return f.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Hora corta de una burbuja, p. ej. «14:05». */
export function horaCorta(iso: string | null | undefined): string {
  const f = aFecha(iso)
  return f ? f.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''
}

/** «Hoy», «Ayer» o «12 de noviembre» (con el año si es de otro año). */
export function etiquetaDia(iso: string, ahora: number = Date.now()): string {
  const f = aFecha(iso)
  if (!f) return ''
  const dias = diasEntre(f, new Date(ahora))
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  const mismoAnio = f.getFullYear() === new Date(ahora).getFullYear()
  return f.toLocaleDateString('es-EC', mismoAnio ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' })
}

export interface GrupoDia<T> {
  /** Clave local `aaaa-mm-dd`. */
  clave: string
  etiqueta: string
  mensajes: T[]
}

function claveDia(f: Date): string {
  const m = String(f.getMonth() + 1).padStart(2, '0')
  const d = String(f.getDate()).padStart(2, '0')
  return `${f.getFullYear()}-${m}-${d}`
}

/** Agrupa mensajes (ya ordenados) por dia local, conservando el orden. */
export function agruparPorDia<T extends { fecha_creacion: string }>(
  mensajes: readonly T[],
  ahora: number = Date.now(),
): GrupoDia<T>[] {
  const grupos: GrupoDia<T>[] = []
  for (const m of mensajes) {
    const f = aFecha(m.fecha_creacion)
    const clave = f ? claveDia(f) : 'sin-fecha'
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.clave === clave) {
      ultimo.mensajes.push(m)
    } else {
      grupos.push({ clave, etiqueta: etiquetaDia(m.fecha_creacion, ahora), mensajes: [m] })
    }
  }
  return grupos
}

// ---- Mensajes ----

/** Une mensajes nuevos con los que ya hay: sin duplicados por id y ordenados por fecha (estable). */
export function fusionarMensajes(actuales: readonly MensajeChat[], nuevos: readonly MensajeChat[]): MensajeChat[] {
  if (nuevos.length === 0) return actuales as MensajeChat[]
  const porId = new Map<string, MensajeChat>()
  for (const m of actuales) porId.set(m.id, m)
  for (const m of nuevos) porId.set(m.id, m)
  const indice = new Map<string, number>()
  Array.from(porId.keys()).forEach((id, i) => indice.set(id, i))
  return Array.from(porId.values()).sort((a, b) => {
    const dif = Date.parse(a.fecha_creacion) - Date.parse(b.fecha_creacion)
    return dif !== 0 && !Number.isNaN(dif) ? dif : (indice.get(a.id) ?? 0) - (indice.get(b.id) ?? 0)
  })
}

/** Fecha del ultimo mensaje confirmado: el refresco pide solo lo posterior. */
export function ultimaFecha(mensajes: readonly MensajeChat[]): string | null {
  for (let i = mensajes.length - 1; i >= 0; i--) {
    if (mensajes[i].fecha_creacion) return mensajes[i].fecha_creacion
  }
  return null
}

/** Quita los envios locales que el servidor ya devolvio (mismo texto, mio, en curso). */
export function sinLocalesConfirmados(locales: readonly MensajeLocal[], nuevos: readonly MensajeChat[]): MensajeLocal[] {
  const propios = nuevos.filter((m) => m.es_mio && m.tipo === 'TEXTO').map((m) => m.texto)
  if (propios.length === 0) return locales as MensajeLocal[]
  const pendientes = [...propios]
  return locales.filter((l) => {
    if (l.estadoLocal !== 'enviando') return true
    const i = pendientes.indexOf(l.texto)
    if (i === -1) return true
    pendientes.splice(i, 1)
    return false
  })
}

/** Tras un PATCH el backend no devuelve la otra persona ni el chat: se conservan los de la lista. */
export function combinarSolicitud(vieja: Solicitud, nueva: Solicitud): Solicitud {
  return {
    ...vieja,
    estado: nueva.estado,
    respuesta: nueva.respuesta,
    fecha_actualizacion: nueva.fecha_actualizacion,
    whatsapp_compartido: nueva.whatsapp_compartido,
    sin_ver: nueva.sin_ver,
  }
}

/** Total para la insignia de la campana. */
export function totalNoLeidos(r: {
  recibidas_nuevas: number
  enviadas_novedades: number
  mensajes_sin_leer: number
}): number {
  return Math.max(0, r.recibidas_nuevas) + Math.max(0, r.enviadas_novedades) + Math.max(0, r.mensajes_sin_leer)
}
