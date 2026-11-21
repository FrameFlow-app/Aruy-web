import { peticion } from './api'
import type {
  Avisos,
  Calificaciones,
  FotoServicio,
  Mensaje,
  PerfilPublico,
  RespuestaAuth,
  Servicio,
  SolicitudRegistro,
  Usuario,
} from './tipos'

// Autenticacion: sin token, para que un 401 de credenciales malas no cierre una sesion ajena.
export const login = (email: string, password: string) =>
  peticion<RespuestaAuth>('/auth/login', { metodo: 'POST', cuerpo: { email, password }, token: null })

export const registro = (datos: SolicitudRegistro) =>
  peticion<RespuestaAuth>('/auth/registro', { metodo: 'POST', cuerpo: datos, token: null })

export const renovar = (token: string) =>
  peticion<RespuestaAuth>('/auth/renovar', { metodo: 'POST', token })

export const olvide = (email: string) =>
  peticion<Mensaje>('/auth/olvide', { metodo: 'POST', cuerpo: { email }, token: null })

export const restablecer = (email: string, codigo: string, password: string) =>
  peticion<Mensaje>('/auth/restablecer', { metodo: 'POST', cuerpo: { email, codigo, password }, token: null })

// Lecturas publicas
export const avisos = () => peticion<Avisos>('/avisos', { token: null })

export const listarServicios = (prestadorId?: string) =>
  peticion<Servicio[]>(
    prestadorId ? `/servicios?prestador_id=${encodeURIComponent(prestadorId)}` : '/servicios',
    { token: null },
  )

export const servicio = (id: string) =>
  peticion<Servicio>(`/servicios/${encodeURIComponent(id)}`, { token: null })

export const fotosServicio = (id: string) =>
  peticion<FotoServicio[]>(`/servicios/${encodeURIComponent(id)}/fotos`, { token: null })

export const perfilPublico = (id: string) =>
  peticion<PerfilPublico>(`/perfiles/${encodeURIComponent(id)}`, { token: null })

export const usuarioPublico = (id: string) =>
  peticion<Usuario>(`/usuarios/${encodeURIComponent(id)}`, { token: null })

export const calificaciones = (perfilPrestadorId: string) =>
  peticion<Calificaciones>(
    `/calificaciones?perfil_prestador_id=${encodeURIComponent(perfilPrestadorId)}`,
    { token: null },
  )
