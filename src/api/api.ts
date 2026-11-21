import { borrarSesion, EVENTO_SESION_EXPIRADA, leerSesion } from './sesion'

export const URL_API: string = (
  (import.meta.env.VITE_API_URL as string | undefined) || 'https://aruy-api.onrender.com'
).replace(/\/+$/, '')

/** Render gratis tarda ~50 s en despertar. */
export const TIEMPO_ESPERA_MS = 60_000

export const MENSAJE_CONECTANDO = 'Conectando con Aruy…'
export const MENSAJE_DEMASIADOS_INTENTOS = 'Hiciste muchos intentos. Espera un momento y vuelve a probar.'

export class ErrorApi extends Error {
  readonly estado: number
  readonly mensaje: string
  constructor(estado: number, mensaje: string) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.estado = estado
    this.mensaje = mensaje
  }
  /** Sin respuesta del servidor (red caida o servidor dormido). */
  get esDeRed(): boolean {
    return this.estado === 0
  }
}

export type MetodoHttp = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface OpcionesPeticion {
  metodo?: MetodoHttp
  /** Objeto que se envia como JSON. */
  cuerpo?: unknown
  /** Si no se indica, se usa el de la sesion guardada. Pasa `null` para no enviar ninguno. */
  token?: string | null
  /** Cuerpo binario crudo (subida de imagenes): va con el Content-Type del blob, no multipart. */
  binario?: Blob
  senal?: AbortSignal
}

function cerrarSesionPorExpiracion(): void {
  borrarSesion()
  window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA))
}

export async function peticion<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const { metodo = 'GET', cuerpo, binario, senal } = opciones
  const token = opciones.token === undefined ? (leerSesion()?.token ?? null) : opciones.token

  const cabeceras: Record<string, string> = { Accept: 'application/json' }
  if (token) cabeceras.Authorization = `Bearer ${token}`

  let body: BodyInit | undefined
  if (binario) {
    cabeceras['Content-Type'] = binario.type || 'application/octet-stream'
    body = binario
  } else if (cuerpo !== undefined) {
    cabeceras['Content-Type'] = 'application/json'
    body = JSON.stringify(cuerpo)
  }

  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_ESPERA_MS)
  senal?.addEventListener('abort', () => controlador.abort(), { once: true })

  let respuesta: Response
  try {
    respuesta = await fetch(`${URL_API}${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body,
      signal: controlador.signal,
    })
  } catch {
    throw new ErrorApi(0, MENSAJE_CONECTANDO)
  } finally {
    clearTimeout(temporizador)
  }

  let datos: unknown = null
  const texto = await respuesta.text().catch(() => '')
  if (texto) {
    try {
      datos = JSON.parse(texto)
    } catch {
      datos = null
    }
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) cerrarSesionPorExpiracion()
    if (respuesta.status === 429) throw new ErrorApi(429, MENSAJE_DEMASIADOS_INTENTOS)
    const mensaje =
      datos && typeof datos === 'object' && typeof (datos as { error?: unknown }).error === 'string'
        ? (datos as { error: string }).error
        : 'No pudimos completar eso. Prueba de nuevo.'
    throw new ErrorApi(respuesta.status, mensaje)
  }
  return datos as T
}
