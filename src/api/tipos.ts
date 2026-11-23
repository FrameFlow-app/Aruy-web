// Tipos del contrato con el backend (ver arruy-backend/routes/*.js y los DTO de Android).

export type Rol = 'PRESTADOR' | 'CONTRATANTE'

export type Categoria =
  | 'PLOMERIA'
  | 'ELECTRICIDAD'
  | 'ALBANILERIA'
  | 'PINTURA'
  | 'CARPINTERIA'
  | 'BELLEZA'
  | 'OTROS'

export const CATEGORIAS: readonly Categoria[] = [
  'PLOMERIA',
  'ELECTRICIDAD',
  'ALBANILERIA',
  'PINTURA',
  'CARPINTERIA',
  'BELLEZA',
  'OTROS',
]

export const ETIQUETA_CATEGORIA: Record<Categoria, string> = {
  PLOMERIA: 'Plomería',
  ELECTRICIDAD: 'Electricidad',
  ALBANILERIA: 'Albañilería',
  PINTURA: 'Pintura',
  CARPINTERIA: 'Carpintería',
  BELLEZA: 'Belleza',
  OTROS: 'Otros',
}

export interface Usuario {
  id: string
  nombre: string
  telefono: string
  rol: Rol
  estado_verificacion: string
  foto_perfil: string | null
  activo: boolean
  /** Solo viene en GET /usuarios/yo. */
  email?: string | null
}

export interface RespuestaAuth {
  token: string
  usuario: Usuario
  perfil_prestador_id: string | null
}

export interface SolicitudLogin {
  email: string
  password: string
}

export interface SolicitudRegistro {
  nombre: string
  telefono: string
  email: string
  password: string
  rol: Rol
  fecha_nacimiento?: string
  oficio_principal?: string
  zona_cobertura?: string
  descripcion_profesional?: string
  anios_experiencia?: number
}

export interface Mensaje {
  mensaje?: string
}

export interface Servicio {
  id: string
  prestador_id: string
  titulo: string
  descripcion: string
  categoria: Categoria | string
  precio_referencial: number | null
  disponible: boolean
}

export interface FotoServicio {
  id: string
  referencia_imagen: string
  url: string | null
  descripcion: string | null
  orden: number | null
  etiquetas: string[]
}

export interface PerfilPublico {
  id: string
  usuario_id: string
  nombre: string
  telefono: string
  /** Numero listo para wa.me (solo digitos con prefijo de pais), puede venir vacio. */
  whatsapp?: string | null
  foto_perfil: string | null
  estado_verificacion: string
  oficio_principal: string | null
  descripcion_profesional: string | null
  zona_cobertura: string | null
  anios_experiencia: number | null
  disponible: boolean
  calificacion_promedio: number | null
  total_calificaciones: number
}

export interface Opinion {
  id: string
  puntuacion: number
  comentario: string | null
  fecha_creacion: string | null
  contratante: string | null
}

export interface Calificaciones {
  perfil_prestador_id: string
  promedio: number | null
  total: number
  calificaciones: Opinion[]
}

export interface Mantenimiento {
  activo: boolean
  mensaje: string
  inicio: string | null
  fin: string | null
}

export interface VersionApp {
  reciente: number
  minima: number
  notas: string
}

export interface Avisos {
  mantenimiento: Mantenimiento | null
  version: VersionApp
}

export function esCategoria(valor: string): valor is Categoria {
  return (CATEGORIAS as readonly string[]).includes(valor)
}

/** Mi perfil de prestador (GET /perfiles/yo). El WhatsApp sale del telefono de la cuenta, no se edita. */
export interface PerfilPropio {
  id: string
  usuario_id: string
  oficio_principal: string | null
  descripcion_profesional: string | null
  zona_cobertura: string | null
  anios_experiencia: number | null
  disponible: boolean
}

/** Campos editables con PATCH /perfiles/yo. */
export interface CambiosPerfilPropio {
  oficio_principal?: string
  zona_cobertura?: string
  descripcion_profesional?: string | null
  anios_experiencia?: number | null
  disponible?: boolean
}

/** Campos editables con PATCH /usuarios/yo; `foto_perfil: null` quita la foto. */
export interface CambiosUsuario {
  nombre?: string
  telefono?: string
  foto_perfil?: null
}

/** Cuerpo de POST /servicios (el backend normaliza el título; usa siempre el devuelto). */
export interface NuevoServicio {
  titulo: string
  descripcion: string
  categoria: Categoria
  precio_referencial: number | null
  disponible: boolean
}

/** Campos editables con PATCH /servicios/:id; `precio_referencial: null` borra el precio. */
export type CambiosServicio = Partial<NuevoServicio>
