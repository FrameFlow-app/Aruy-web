import { peticion } from '../../api/api'
import type {
  EstadoSolicitud,
  MensajeChat,
  ResumenSolicitudes,
  Solicitud,
  TipoBandeja,
} from './tipos'

// Endpoints de solicitudes y chat. Viven aqui (y no en api/endpoints.ts) para no pisar otros cambios.

export const crearSolicitud = (servicioId: string, mensaje: string) =>
  peticion<Solicitud>('/solicitudes', { metodo: 'POST', cuerpo: { servicio_id: servicioId, mensaje } })

export const listarSolicitudes = (tipo: TipoBandeja) =>
  peticion<Solicitud[]>(`/solicitudes?tipo=${tipo}`)

export const resumenSolicitudes = () => peticion<ResumenSolicitudes>('/solicitudes/resumen')

export const marcarVistas = (tipo: TipoBandeja) =>
  peticion<{ marcadas: number }>('/solicitudes/vistas', { metodo: 'POST', cuerpo: { tipo } })

export const cambiarEstado = (id: string, estado: EstadoSolicitud, respuesta?: string) =>
  peticion<Solicitud>(`/solicitudes/${encodeURIComponent(id)}`, {
    metodo: 'PATCH',
    cuerpo: respuesta ? { estado, respuesta } : { estado },
  })

export const listarMensajes = (id: string, desde?: string | null) =>
  peticion<MensajeChat[]>(
    `/solicitudes/${encodeURIComponent(id)}/mensajes${desde ? `?desde=${encodeURIComponent(desde)}` : ''}`,
  )

export const enviarMensaje = (id: string, texto: string) =>
  peticion<MensajeChat>(`/solicitudes/${encodeURIComponent(id)}/mensajes`, { metodo: 'POST', cuerpo: { texto } })

export const compartirWhatsapp = (id: string) =>
  peticion<MensajeChat>(`/solicitudes/${encodeURIComponent(id)}/whatsapp`, { metodo: 'POST' })
