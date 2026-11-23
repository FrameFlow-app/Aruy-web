import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { aplicarActualizacion } from './actualizar'

function simularSW(waiting?: { postMessage: () => void }) {
  const oyentes: Record<string, () => void> = {}
  const sw = {
    addEventListener: vi.fn((tipo: string, fn: () => void) => {
      oyentes[tipo] = fn
    }),
    getRegistration: vi.fn().mockResolvedValue({ waiting }),
  }
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: sw })
  return { sw, oyentes }
}

describe('aplicarActualizacion', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('recarga directo si no hay SW en espera', async () => {
    simularSW(undefined)
    const recargar = vi.fn()
    const plugin = vi.fn()
    await aplicarActualizacion({ actualizarPlugin: plugin, recargar })
    expect(recargar).toHaveBeenCalledTimes(1)
    expect(plugin).not.toHaveBeenCalled()
  })

  it('envia SKIP_WAITING aunque el plugin quede colgado', async () => {
    const waiting = { postMessage: vi.fn() }
    simularSW(waiting)
    const plugin = vi.fn(() => new Promise<void>(() => {}))
    const promesa = aplicarActualizacion({ actualizarPlugin: plugin, recargar: vi.fn() })
    await vi.advanceTimersByTimeAsync(1000)
    await promesa
    expect(plugin).toHaveBeenCalledWith(true)
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
  })

  it('recarga una sola vez al cambiar el controlador', async () => {
    const { oyentes } = simularSW({ postMessage: vi.fn() })
    const recargar = vi.fn()
    await aplicarActualizacion({ actualizarPlugin: vi.fn(), recargar })
    oyentes.controllerchange()
    oyentes.controllerchange()
    await vi.advanceTimersByTimeAsync(5000)
    expect(recargar).toHaveBeenCalledTimes(1)
  })

  it('recarga como ultimo recurso a los 4 s', async () => {
    simularSW({ postMessage: vi.fn() })
    const recargar = vi.fn()
    await aplicarActualizacion({ actualizarPlugin: vi.fn(), recargar })
    expect(recargar).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(4000)
    expect(recargar).toHaveBeenCalledTimes(1)
  })
})
