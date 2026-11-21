import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import { ErrorApi } from '../../api/api'

/** Pasado este tiempo sin respuesta se avisa «Conectando con Aruy…» (el servidor gratuito se duerme). */
export const ESPERA_LENTA_MS = 4000

export interface EstadoCarga<T> {
  cargando: boolean
  datos: T | null
  /** Mensaje listo para mostrar; null si no hubo error. */
  error: string | null
  /** Código HTTP del error (0 = sin conexión), si lo hubo. */
  estadoHttp: number | null
  /** Tarda más de lo normal. */
  lento: boolean
  reintentar: () => void
}

interface Resultado<T> {
  clave: string
  datos: T | null
  error: string | null
  estadoHttp: number | null
}

/**
 * Carga datos al montar y cada vez que cambia `clave`. `cargar` puede cambiar en cada render
 * sin repetir la petición; solo `clave` y `reintentar` la disparan.
 */
export function useCarga<T>(clave: string, cargar: () => Promise<T>): EstadoCarga<T> {
  const [intento, setIntento] = useState(0)
  const [resultado, setResultado] = useState<Resultado<T> | null>(null)
  const [lentaDe, setLentaDe] = useState<string | null>(null)
  const claveCompleta = `${clave}#${intento}`
  const ejecutar = useEffectEvent(cargar)

  useEffect(() => {
    let vivo = true
    const temporizador = setTimeout(() => {
      if (vivo) setLentaDe(claveCompleta)
    }, ESPERA_LENTA_MS)
    ejecutar()
      .then((datos) => {
        if (vivo) setResultado({ clave: claveCompleta, datos, error: null, estadoHttp: null })
      })
      .catch((e: unknown) => {
        if (!vivo) return
        const http = e instanceof ErrorApi ? e.estado : 0
        const mensaje = e instanceof ErrorApi ? e.mensaje : 'No pudimos completar eso. Prueba de nuevo.'
        setResultado({ clave: claveCompleta, datos: null, error: mensaje, estadoHttp: http })
      })
      .finally(() => clearTimeout(temporizador))
    return () => {
      vivo = false
      clearTimeout(temporizador)
    }
  }, [claveCompleta])

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])
  const actual = resultado?.clave === claveCompleta ? resultado : null
  return {
    cargando: actual === null,
    datos: actual?.datos ?? null,
    error: actual?.error ?? null,
    estadoHttp: actual?.estadoHttp ?? null,
    lento: actual === null && lentaDe === claveCompleta,
    reintentar,
  }
}
