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
  /** 0 = todas; 4 = «4 o más»; 4,5 = «4,5 o más». */
  calificacionMin: number
  soloVerificados: boolean
  orden: Orden
}

export type Orden = 'calificacion' | 'precio' | 'alfabetico'

export const ORDENES: readonly { valor: Orden; etiqueta: string; descripcion: string }[] = [
  { valor: 'calificacion', etiqueta: 'Mejor calificación', descripcion: 'Las mejores opiniones primero' },
  { valor: 'precio', etiqueta: 'Menor precio', descripcion: 'Desde el precio referencial más bajo' },
  { valor: 'alfabetico', etiqueta: 'Orden alfabético', descripcion: 'De la A a la Z por título' },
]

export const CALIFICACIONES_MIN = [
  { valor: 0, etiqueta: 'Todas' },
  { valor: 4, etiqueta: '4 o más' },
  { valor: 4.5, etiqueta: '4,5 o más' },
] as const

export const FILTROS_VACIOS: Filtros = {
  texto: '',
  categoria: null,
  zona: null,
  precioMax: null,
  soloDisponibles: false,
  calificacionMin: 0,
  soloVerificados: false,
  orden: 'calificacion',
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

function porTitulo(a: ServicioConPrestador, b: ServicioConPrestador): number {
  return normalizar(a.servicio.titulo).localeCompare(normalizar(b.servicio.titulo))
}

/** Por defecto, mejor calificados primero; a igualdad, más opiniones y luego orden alfabético. */
function ordenar(items: ServicioConPrestador[], orden: Orden): ServicioConPrestador[] {
  if (orden === 'alfabetico') return [...items].sort(porTitulo)
  if (orden === 'precio') {
    // Sin precio (a convenir) va al final.
    return [...items].sort(
      (a, b) =>
        (a.servicio.precio_referencial ?? Number.MAX_VALUE) - (b.servicio.precio_referencial ?? Number.MAX_VALUE) ||
        porTitulo(a, b),
    )
  }
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
    if (filtros.calificacionMin > 0 && (prestador?.calificacion_promedio ?? 0) < filtros.calificacionMin) return false
    if (filtros.soloDisponibles && !disponibleAhora(item)) return false
    if (filtros.soloVerificados && !estaVerificado(prestador)) return false
    if (filtros.precioMax !== null && servicio.precio_referencial !== null && servicio.precio_referencial > filtros.precioMax) {
      return false
    }
    if (palabras.length > 0 && !coincide(item, palabras)) return false
    return true
  })
  return ordenar(resultado, filtros.orden)
}

/** Cuántos filtros hay activos (sin contar el texto ni el orden). */
export function cantidadActivos(f: Filtros): number {
  return [
    f.categoria !== null,
    f.zona !== null,
    f.precioMax !== null,
    f.calificacionMin > 0,
    f.soloDisponibles,
    f.soloVerificados,
  ].filter(Boolean).length
}

export function filtrosDesdeQuery(params: URLSearchParams): Filtros {
  const categoria = (params.get('categoria') ?? '').toUpperCase()
  const zona = params.get('zona') ?? ''
  const precio = Number(params.get('precio'))
  const calificacion = Number(params.get('calif'))
  const orden = params.get('orden')
  return {
    texto: params.get('q') ?? '',
    categoria: (CATEGORIAS as readonly string[]).includes(categoria) ? categoria : null,
    zona: (ZONAS as readonly string[]).includes(zona) ? zona : null,
    precioMax: Number.isFinite(precio) && precio >= PRECIO_MIN && precio < PRECIO_SIN_LIMITE ? precio : null,
    soloDisponibles: params.get('disponibles') === '1',
    calificacionMin: CALIFICACIONES_MIN.some((c) => c.valor > 0 && c.valor === calificacion) ? calificacion : 0,
    soloVerificados: params.get('verificados') === '1',
    orden: ORDENES.find((o) => o.valor === orden)?.valor ?? 'calificacion',
  }
}

export function filtrosAQuery(f: Filtros): URLSearchParams {
  const p = new URLSearchParams()
  if (f.texto) p.set('q', f.texto)
  if (f.categoria) p.set('categoria', f.categoria)
  if (f.zona) p.set('zona', f.zona)
  if (f.precioMax !== null) p.set('precio', String(f.precioMax))
  if (f.soloDisponibles) p.set('disponibles', '1')
  if (f.calificacionMin > 0) p.set('calif', String(f.calificacionMin))
  if (f.soloVerificados) p.set('verificados', '1')
  if (f.orden !== 'calificacion') p.set('orden', f.orden)
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
