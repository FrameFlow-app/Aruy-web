import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRefrescoVisible } from './useRefrescoVisible'

let visibilidad: DocumentVisibilityState = 'visible'

function cambiarVisibilidad(v: DocumentVisibilityState) {
  visibilidad = v
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useRefrescoVisible', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    visibilidad = 'visible'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibilidad)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('refresca cada intervalo mientras está visible y no al montar', () => {
    const f = vi.fn()
    renderHook(() => useRefrescoVisible(f, 8000))
    expect(f).not.toHaveBeenCalled()
    vi.advanceTimersByTime(8000)
    expect(f).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(16000)
    expect(f).toHaveBeenCalledTimes(3)
  })

  it('se detiene al ocultarse la pestaña y refresca al volver', () => {
    const f = vi.fn()
    renderHook(() => useRefrescoVisible(f, 8000))
    cambiarVisibilidad('hidden')
    vi.advanceTimersByTime(40000)
    expect(f).not.toHaveBeenCalled()
    cambiarVisibilidad('visible')
    expect(f).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(8000)
    expect(f).toHaveBeenCalledTimes(2)
  })

  it('no arranca si la pestaña empieza oculta', () => {
    visibilidad = 'hidden'
    const f = vi.fn()
    renderHook(() => useRefrescoVisible(f, 8000))
    vi.advanceTimersByTime(30000)
    expect(f).not.toHaveBeenCalled()
  })

  it('limpia el intervalo y el listener al desmontar', () => {
    const f = vi.fn()
    const { unmount } = renderHook(() => useRefrescoVisible(f, 8000))
    unmount()
    vi.advanceTimersByTime(30000)
    cambiarVisibilidad('visible')
    expect(f).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('no hace nada si está inactivo', () => {
    const f = vi.fn()
    renderHook(() => useRefrescoVisible(f, 8000, false))
    vi.advanceTimersByTime(30000)
    expect(f).not.toHaveBeenCalled()
  })
})
