// Preparar la foto de perfil en el navegador antes de subirla: se achica y se pasa a JPEG.
// JPEG y no WebP porque Safari de iOS no sabe codificar WebP en canvas; el servidor la convierte a WebP.

export const LADO_MAXIMO = 512
export const CALIDAD_JPEG = 0.85

export class ErrorImagen extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorImagen'
  }
}

/** Mantiene la proporción, el lado mayor queda en `maximo` como mucho y nunca agranda. */
export function dimensionesRedimension(ancho: number, alto: number, maximo = LADO_MAXIMO): { ancho: number; alto: number } {
  if (!(ancho > 0) || !(alto > 0)) return { ancho: 1, alto: 1 }
  const escala = Math.min(1, maximo / Math.max(ancho, alto))
  return {
    ancho: Math.max(1, Math.round(ancho * escala)),
    alto: Math.max(1, Math.round(alto * escala)),
  }
}

export const MENSAJE_NO_IMAGEN = 'Ese archivo no es una imagen. Elige una foto de tu galería o toma una nueva.'
export const MENSAJE_NO_LEGIBLE =
  'No pudimos leer esa foto. Si es un formato poco común (como HEIC), elige otra o haz una captura de pantalla de ella.'

export interface Origen {
  fuente: CanvasImageSource
  ancho: number
  alto: number
  liberar: () => void
}

export async function decodificar(archivo: File | Blob): Promise<Origen> {
  if (typeof createImageBitmap === 'function') {
    try {
      // 'from-image' aplica la orientación EXIF: las fotos del iPhone no salen giradas.
      const mapa = await createImageBitmap(archivo, { imageOrientation: 'from-image' })
      return { fuente: mapa, ancho: mapa.width, alto: mapa.height, liberar: () => mapa.close() }
    } catch {
      // Se prueba con <img>, que también respeta EXIF en los navegadores actuales.
    }
  }
  const url = URL.createObjectURL(archivo)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return {
      fuente: img,
      ancho: img.naturalWidth,
      alto: img.naturalHeight,
      liberar: () => URL.revokeObjectURL(url),
    }
  } catch {
    URL.revokeObjectURL(url)
    throw new ErrorImagen(MENSAJE_NO_LEGIBLE)
  }
}

/** Devuelve un JPEG de máximo 512 px de lado mayor, listo para POST /usuarios/yo/foto. */
export async function redimensionarImagen(archivo: File | Blob): Promise<Blob> {
  if (!archivo.type.startsWith('image/')) throw new ErrorImagen(MENSAJE_NO_IMAGEN)
  const origen = await decodificar(archivo)
  try {
    if (!origen.ancho || !origen.alto) throw new ErrorImagen(MENSAJE_NO_LEGIBLE)
    const { ancho, alto } = dimensionesRedimension(origen.ancho, origen.alto)
    const lienzo = document.createElement('canvas')
    lienzo.width = ancho
    lienzo.height = alto
    const ctx = lienzo.getContext('2d')
    if (!ctx) throw new ErrorImagen(MENSAJE_NO_LEGIBLE)
    // JPEG no tiene transparencia: un PNG con fondo transparente saldría negro.
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, ancho, alto)
    ctx.drawImage(origen.fuente, 0, 0, ancho, alto)
    const blob = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, 'image/jpeg', CALIDAD_JPEG))
    if (!blob) throw new ErrorImagen(MENSAJE_NO_LEGIBLE)
    return blob
  } finally {
    origen.liberar()
  }
}
