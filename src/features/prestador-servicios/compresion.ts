// Plan de compresión de fotos de servicio, como PlanWebp.kt de Android pero en JPEG
// (Safari no sabe codificar WebP; el servidor la convierte a WebP de 1280 px y 500 KB).

export const LADO_MAX_SERVICIO = 1280
export const MAX_BYTES = 500 * 1024
/** Se empieza en 0,85 y solo se baja si la foto no cabe en 500 KB. */
export const CALIDADES = [0.85, 0.75, 0.65, 0.5] as const
/** Si ni con la calidad más baja cabe, se reduce el lado largo. */
export const LADOS = [LADO_MAX_SERVICIO, 1024, 800] as const

export interface Intento {
  lado: number
  calidad: number
}

/** Orden en que se prueban las combinaciones: para cada lado, de mejor a peor calidad. */
export function planDeIntentos(): Intento[] {
  return LADOS.flatMap((lado) => CALIDADES.map((calidad) => ({ lado, calidad })))
}

export interface Comprimida {
  blob: Blob
  lado: number
  calidad: number
  /** false si ni el último intento cupo en 500 KB; el servidor la vuelve a comprimir. */
  cabe: boolean
  intentos: number
}

/**
 * Prueba cada combinación hasta que el resultado pese ≤ `maxBytes`.
 * Si ninguna cabe devuelve el último intento (el más pequeño); null solo si el codificador falla siempre.
 */
export async function elegirCompresion(
  codificar: (intento: Intento) => Promise<Blob | null>,
  maxBytes = MAX_BYTES,
): Promise<Comprimida | null> {
  let ultimo: Comprimida | null = null
  let n = 0
  for (const intento of planDeIntentos()) {
    n += 1
    const blob = await codificar(intento)
    if (!blob) continue
    ultimo = { blob, ...intento, cabe: blob.size <= maxBytes, intentos: n }
    if (ultimo.cabe) return ultimo
  }
  return ultimo
}
