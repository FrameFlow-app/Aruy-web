// Contrato de /solicitudes (ver arruy-backend/routes/solicitudes.js y mensajes.js).

export type EstadoSolicitud = 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA' | 'CANCELADA' | 'COMPLETADA'

export type TipoBandeja = 'enviadas' | 'recibidas'

export interface Contraparte {
  nombre: string
  foto_perfil: string | null
  /** Solo llega cuando el backend lo permite (prestador que compartio su WhatsApp, o solicitud aceptada). */
  telefono: string | null
}

export interface UltimoMensaje {
  texto: string
  fecha: string
}

export interface Solicitud {
  id: string
  servicio_id: string | null
  servicio_titulo: string | null
  estado: EstadoSolicitud
  /** Mensaje inicial (5 a 500 caracteres). */
  mensaje: string
  respuesta: string | null
  fecha_creacion: string
  fecha_actualizacion: string | null
  sin_ver: boolean
  whatsapp_compartido: boolean
  mensajes_sin_leer: number
  ultimo_mensaje: UltimoMensaje | null
  contraparte: Contraparte
}

export interface ResumenSolicitudes {
  recibidas_nuevas: number
  recibidas_pendientes: number
  enviadas_novedades: number
  mensajes_sin_leer: number
}

export type TipoMensajeChat = 'TEXTO' | 'WHATSAPP'

export interface MensajeChat {
  id: string
  autor_id: string
  es_mio: boolean
  /** En los mensajes WHATSAPP es el numero ya listo para wa.me. */
  texto: string
  tipo: TipoMensajeChat | string
  fecha_creacion: string
}

/** Mensaje que aun no confirmo el servidor (envio optimista). */
export interface MensajeLocal extends MensajeChat {
  estadoLocal: 'enviando' | 'fallido'
}

export const MENSAJE_SOLICITUD_MIN = 5
export const MENSAJE_SOLICITUD_MAX = 500
export const RESPUESTA_MAX = 300
export const TEXTO_CHAT_MAX = 1000

export const ETIQUETA_ESTADO: Record<EstadoSolicitud, string> = {
  PENDIENTE: 'Pendiente',
  ACEPTADA: 'Aceptada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
  COMPLETADA: 'Completada',
}
