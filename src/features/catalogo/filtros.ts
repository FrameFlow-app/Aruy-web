import type { PerfilPublico, Servicio } from '../../api/tipos'
import { CATEGORIAS, ETIQUETA_CATEGORIA, esCategoria } from '../../api/tipos'

/** Un servicio junto con los datos públicos de quien lo ofrece (null si no se pudieron leer). */
export interface ServicioConPrestador {
  servicio: Servicio
  prestador: PerfilPublico | null
}

export interface Filtros {
  texto: string
  categoria: string | null
  zona: string | null
  /** null = sin límite. */
  precioMax: number | null
  soloDisponibles: boolean
}

export const FILTROS_VACIOS: Filtros = {
  texto: '',
  categoria: null,
  zona: null,
  precioMax: null,
  soloDisponibles: false,
}

export const ZONAS = ['Norte', 'Centro', 'Sur', 'Valles'] as const
export const PRECIO_MIN = 10
export const PRECIO_SIN_LIMITE = 100
export const PASO_PRECIO = 5

/** Minúsculas y sin tildes: «Plomería» y «plomeria» son lo mismo al buscar. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}+/gu, '')
    .trim()
}

export function etiquetaCategoria(categoria: string): string {
  return esCategoria(categoria) ? ETIQUETA_CATEGORIA[categoria] : categoria
}

/** «Disponible ahora»: el servicio no está pausado y su prestador recibe solicitudes. */
export function disponibleAhora(item: ServicioConPrestador): boolean {
  return item.servicio.disponible && (item.prestador?.disponible ?? true)
}

export function estaVerificado(prestador: PerfilPublico | null): boolean {
  return prestador?.estado_verificacion === 'VERIFICADA'
}

function coincide(item: ServicioConPrestador, palabras: string[]): boolean {
  const pajar = normalizar(
    [
      item.servicio.titulo,
      item.servicio.descripcion,
      etiquetaCategoria(item.servicio.categoria),
      item.prestador?.nombre ?? '',
      item.prestador?.oficio_principal ?? '',
    ].join(' '),
  )
  // «plomeros» o «instalaciones» también encuentran «plomero» e «instalacion».
  return palabras.every(
    (p) =>
      pajar.includes(p) ||
      (p.length > 3 && (pajar.includes(p.replace(/es$/, '')) || pajar.includes(p.replace(/s$/, '')))),
  )
}

/** Mejor calificados primero; a igualdad, más opiniones y luego orden alfabético. */
function ordenar(items: ServicioConPrestador[]): ServicioConPrestador[] {
  return [...items].sort((a, b) => {
    const pa = a.prestador?.calificacion_promedio ?? -1
    const pb = b.prestador?.calificacion_promedio ?? -1
    if (pa !== pb) return pb - pa
    const ta = a.prestador?.total_calificaciones ?? 0
    const tb = b.prestador?.total_calificaciones ?? 0
    if (ta !== tb) return tb - ta
    return normalizar(a.servicio.titulo).localeCompare(normalizar(b.servicio.titulo))
  })
}

export function filtrarServicios(items: ServicioConPrestador[], filtros: Filtros): ServicioConPrestador[] {
  const palabras = normalizar(filtros.texto).split(/\s+/).filter(Boolean)
  const zona = filtros.zona ? normalizar(filtros.zona) : null
  const resultado = items.filter((item) => {
    const { servicio, prestador } = item
    if (filtros.categoria && servicio.categoria !== filtros.categoria) return false
    if (zona && !normalizar(prestador?.zona_cobertura ?? '').includes(zona)) return false
    if (filtros.soloDisponibles && !disponibleAhora(item)) return false
    if (filtros.precioMax !== null && servicio.precio_referencial !== null && servicio.precio_referencial > filtros.precioMax) {
      return false
    }
    if (palabras.length > 0 && !coincide(item, palabras)) return false
    return true
  })
  return ordenar(resultado)
}

/** Cuántos filtros hay activos (sin contar el texto). */
export function cantidadActivos(f: Filtros): number {
  return [f.categoria !== null, f.zona !== null, f.precioMax !== null, f.soloDisponibles].filter(Boolean).length
}

export function filtrosDesdeQuery(params: URLSearchParams): Filtros {
  const categoria = (params.get('categoria') ?? '').toUpperCase()
  const zona = params.get('zona') ?? ''
  const precio = Number(params.get('precio'))
  return {
    texto: params.get('q') ?? '',
    categoria: (CATEGORIAS as readonly string[]).includes(categoria) ? categoria : null,
    zona: (ZONAS as readonly string[]).includes(zona) ? zona : null,
    precioMax: Number.isFinite(precio) && precio >= PRECIO_MIN && precio < PRECIO_SIN_LIMITE ? precio : null,
    soloDisponibles: params.get('disponibles') === '1',
  }
}

export function filtrosAQuery(f: Filtros): URLSearchParams {
  const p = new URLSearchParams()
  if (f.texto) p.set('q', f.texto)
  if (f.categoria) p.set('categoria', f.categoria)
  if (f.zona) p.set('zona', f.zona)
  if (f.precioMax !== null) p.set('precio', String(f.precioMax))
  if (f.soloDisponibles) p.set('disponibles', '1')
  return p
}

/** «$20» o «$12,50». */
export function formatoDinero(valor: number): string {
  const entero = Number.isInteger(valor)
  return '$' + valor.toLocaleString('es-EC', { minimumFractionDigits: entero ? 0 : 2, maximumFractionDigits: 2 })
}

export function textoPrecio(precio: number | null): string {
  return precio === null ? 'Precio a convenir' : `Desde ${formatoDinero(precio)}`
}

export function formatoPromedio(promedio: number): string {
  return promedio.toLocaleString('es-EC', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
