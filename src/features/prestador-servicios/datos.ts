import { useCallback, useEffect, useState } from 'react'
import * as endpoints from '../../api/endpoints'
import { mensajeDeError } from '../../pages/cuenta/ayudas'
import type { FotoServicio, Servicio } from '../../api/tipos'

export interface ServicioPropio {
  servicio: Servicio
  /** Ordenadas: la primera es la portada. */
  fotos: FotoServicio[]
}

export function ordenarFotos(fotos: FotoServicio[]): FotoServicio[] {
  return [...fotos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
}

/** El servicio guarda el id del PERFIL de prestador; la sesión lo trae, y si no, se pide. */
export async function perfilIdPropio(idDeSesion: string | null): Promise<string> {
  if (idDeSesion) return idDeSesion
  return (await endpoints.miPerfilPrestador()).id
}

export async function cargarMisServicios(perfilId: string): Promise<ServicioPropio[]> {
  const servicios = await endpoints.listarServicios(perfilId)
  return Promise.all(
    servicios.map(async (servicio) => ({
      servicio,
      fotos: ordenarFotos(await endpoints.fotosServicio(servicio.id).catch(() => [])),
    })),
  )
}

export type EstadoCarga = 'cargando' | 'listo' | 'error'

/** Carga mis servicios con sus fotos. `setItems` deja actualizar la lista sin volver a pedirla. */
export function useMisServicios(perfilIdDeSesion: string | null) {
  const [estado, setEstado] = useState<EstadoCarga>('cargando')
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<ServicioPropio[]>([])
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    perfilIdPropio(perfilIdDeSesion)
      .then(cargarMisServicios)
      .then((lista) => {
        if (!vigente) return
        setItems(lista)
        setEstado('listo')
      })
      .catch((e: unknown) => {
        if (!vigente) return
        setError(mensajeDeError(e))
        setEstado('error')
      })
    return () => {
      vigente = false
    }
  }, [perfilIdDeSesion, intento])

  const recargar = useCallback(() => {
    setEstado('cargando')
    setError(null)
    setIntento((n) => n + 1)
  }, [])

  return { estado, error, items, setItems, recargar }
}
