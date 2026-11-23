import { describe, expect, it } from 'vitest'
import { CALIDADES, elegirCompresion, LADOS, MAX_BYTES, planDeIntentos, type Intento } from './compresion'

const blobDe = (bytes: number) => new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' })

describe('plan de compresión', () => {
  it('prueba cada lado de mayor a menor y, dentro de cada uno, la calidad de mejor a peor', () => {
    const plan = planDeIntentos()
    expect(plan).toHaveLength(LADOS.length * CALIDADES.length)
    expect(plan[0]).toEqual({ lado: 1280, calidad: 0.85 })
    expect(plan[CALIDADES.length - 1]).toEqual({ lado: 1280, calidad: 0.5 })
    expect(plan[CALIDADES.length]).toEqual({ lado: 1024, calidad: 0.85 })
    expect(plan[plan.length - 1]).toEqual({ lado: 800, calidad: 0.5 })
  })

  it('se queda con el primer intento que cabe', async () => {
    const vistos: Intento[] = []
    const r = await elegirCompresion(async (i) => {
      vistos.push(i)
      return blobDe(i.calidad === 0.85 ? 900 * 1024 : 400 * 1024)
    })
    expect(r).toMatchObject({ lado: 1280, calidad: 0.75, cabe: true, intentos: 2 })
    expect(vistos).toHaveLength(2)
  })

  it('baja el lado cuando ni la calidad más baja cabe', async () => {
    const r = await elegirCompresion(async ({ lado }) => blobDe(lado === 800 ? 100 * 1024 : 2 * MAX_BYTES))
    expect(r).toMatchObject({ lado: 800, calidad: 0.85, cabe: true, intentos: CALIDADES.length * 2 + 1 })
  })

  it('si nada cabe devuelve el último intento marcado como que no cabe', async () => {
    const r = await elegirCompresion(async () => blobDe(2 * MAX_BYTES))
    expect(r).toMatchObject({ lado: 800, calidad: 0.5, cabe: false })
  })

  it('devuelve null si el codificador siempre falla', async () => {
    expect(await elegirCompresion(async () => null)).toBeNull()
  })
})
