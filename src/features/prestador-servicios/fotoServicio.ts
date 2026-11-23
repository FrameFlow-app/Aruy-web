import { decodificar, dimensionesRedimension, ErrorImagen, MENSAJE_NO_IMAGEN, MENSAJE_NO_LEGIBLE } from '../micuenta/imagen'
import { elegirCompresion, type Comprimida } from './compresion'

/**
 * Prepara una foto de servicio en el navegador: respeta la orientación EXIF, la achica a ≤1280 px
 * y la pasa a JPEG bajando calidad y lado hasta que pese ≤500 KB.
 */
export async function prepararFotoServicio(archivo: File | Blob): Promise<Comprimida> {
  if (!archivo.type.startsWith('image/')) throw new ErrorImagen(MENSAJE_NO_IMAGEN)
  const origen = await decodificar(archivo)
  try {
    if (!origen.ancho || !origen.alto) throw new ErrorImagen(MENSAJE_NO_LEGIBLE)
    const lienzos = new Map<number, HTMLCanvasElement>()
    const lienzoPara = (lado: number): HTMLCanvasElement | null => {
      const previo = lienzos.get(lado)
      if (previo) return previo
      const { ancho, alto } = dimensionesRedimension(origen.ancho, origen.alto, lado)
      const lienzo = document.createElement('canvas')
      lienzo.width = ancho
      lienzo.height = alto
      const ctx = lienzo.getContext('2d')
      if (!ctx) return null
      // JPEG no tiene transparencia: un PNG con fondo transparente saldría negro.
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, ancho, alto)
      ctx.drawImage(origen.fuente, 0, 0, ancho, alto)
      lienzos.set(lado, lienzo)
      return lienzo
    }
    const resultado = await elegirCompresion(
      ({ lado, calidad }) =>
        new Promise<Blob | null>((ok) => {
          const lienzo = lienzoPara(lado)
          if (!lienzo) ok(null)
          else lienzo.toBlob(ok, 'image/jpeg', calidad)
        }),
    )
    if (!resultado) throw new ErrorImagen(MENSAJE_NO_LEGIBLE)
    return resultado
  } finally {
    origen.liberar()
  }
}
