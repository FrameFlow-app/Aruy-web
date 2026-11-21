import { useEffect, useEffectEvent } from 'react'

/**
 * Llama a `refrescar` cada `intervaloMs` solo mientras la pestaña está a la vista.
 * Al ocultarse se detiene; al volver se refresca de inmediato y se reanuda el ritmo.
 * No llama al montar: la primera carga la hace quien usa el hook.
 */
export function useRefrescoVisible(refrescar: () => void, intervaloMs: number, activo = true): void {
  const ejecutar = useEffectEvent(refrescar)

  useEffect(() => {
    if (!activo) return
    let temporizador: ReturnType<typeof setInterval> | null = null

    const parar = () => {
      if (temporizador !== null) {
        clearInterval(temporizador)
        temporizador = null
      }
    }
    const arrancar = () => {
      if (temporizador === null) temporizador = setInterval(() => ejecutar(), intervaloMs)
    }
    const alCambiar = () => {
      if (document.visibilityState === 'visible') {
        ejecutar()
        arrancar()
      } else {
        parar()
      }
    }

    if (document.visibilityState === 'visible') arrancar()
    document.addEventListener('visibilitychange', alCambiar)
    return () => {
      document.removeEventListener('visibilitychange', alCambiar)
      parar()
    }
  }, [intervaloMs, activo])
}
