import * as endpoints from '../../api/endpoints'
import type { PerfilPublico } from '../../api/tipos'
import type { ServicioConPrestador } from './filtros'

const VIGENCIA_MS = 60_000

let cache: { en: number; promesa: Promise<ServicioConPrestador[]> } | null = null

async function descargar(): Promise<ServicioConPrestador[]> {
  const servicios = await endpoints.listarServicios()
  // El backend no tiene listado de perfiles: se pide cada prestador una sola vez (como la app Android).
  const ids = [...new Set(servicios.map((s) => s.prestador_id))]
  const respuestas = await Promise.allSettled(ids.map((id) => endpoints.perfilPublico(id)))
  const porId = new Map<string, PerfilPublico>()
  respuestas.forEach((r, i) => {
    if (r.status === 'fulfilled') porId.set(ids[i], r.value)
  })
  return servicios.map((servicio) => ({ servicio, prestador: porId.get(servicio.prestador_id) ?? null }))
}

/** Catálogo completo con los datos del prestador. Se comparte entre Inicio y Buscar durante un minuto. */
export function cargarCatalogo(forzar = false): Promise<ServicioConPrestador[]> {
  if (!forzar && cache && Date.now() - cache.en < VIGENCIA_MS) return cache.promesa
  const promesa = descargar()
  const entrada = { en: Date.now(), promesa }
  cache = entrada
  promesa.catch(() => {
    if (cache === entrada) cache = null
  })
  return promesa
}

const portadas = new Map<string, string | null>()

export function portadaEnCache(servicioId: string): string | null | undefined {
  return portadas.get(servicioId)
}

/** Primera foto del servicio, o null si no tiene o no se pudo leer. */
export async function cargarPortada(servicioId: string): Promise<string | null> {
  if (portadas.has(servicioId)) return portadas.get(servicioId) ?? null
  try {
    const fotos = await endpoints.fotosServicio(servicioId)
    const primera = [...fotos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)).find((f) => f.url)
    const url = primera?.url ?? null
    portadas.set(servicioId, url)
    return url
  } catch {
    return null
  }
}
