import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import * as endpoints from './endpoints'
import { ErrorApi } from './api'
import {
  borrarSesion,
  debeRenovar,
  EVENTO_SESION_EXPIRADA,
  guardarSesion,
  leerSesion,
  tokenVencido,
  type Sesion,
} from './sesion'
import type { RespuestaAuth } from './tipos'

interface ValorSesion {
  sesion: Sesion | null
  /** Guarda la respuesta de login/registro. */
  iniciar: (r: RespuestaAuth) => void
  cerrar: () => void
}

const Contexto = createContext<ValorSesion | null>(null)

function deRespuesta(r: RespuestaAuth): Sesion {
  return guardarSesion({ token: r.token, usuario: r.usuario, perfilPrestadorId: r.perfil_prestador_id })
}

export function SesionProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(() => {
    const s = leerSesion()
    if (s && tokenVencido(s.token)) {
      borrarSesion()
      return null
    }
    return s
  })
  const navegar = useNavigate()
  const renovando = useRef(false)

  const cerrar = useCallback(() => {
    borrarSesion()
    setSesion(null)
  }, [])

  const iniciar = useCallback((r: RespuestaAuth) => setSesion(deRespuesta(r)), [])

  // El servidor dijo 401 en alguna peticion: se limpia y se lleva a Ingresar.
  useEffect(() => {
    const alExpirar = () => {
      setSesion(null)
      navegar('/ingresar', { replace: true })
    }
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
  }, [navegar])

  // Al abrir la app: si el token tiene mas de un dia, se pide uno nuevo (dura 30 dias desde cada renovacion).
  useEffect(() => {
    const actual = leerSesion()
    if (!actual || renovando.current || !debeRenovar(actual.token)) return
    renovando.current = true
    endpoints
      .renovar(actual.token)
      .then((r) => setSesion(deRespuesta(r)))
      .catch((e: unknown) => {
        // El 401 ya limpia la sesion y avisa por evento; un fallo de red conserva la sesion actual.
        if (e instanceof ErrorApi && e.estado === 401) cerrar()
      })
      .finally(() => {
        renovando.current = false
      })
  }, [cerrar])

  const valor = useMemo(() => ({ sesion, iniciar, cerrar }), [sesion, iniciar, cerrar])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSesion(): ValorSesion {
  const v = useContext(Contexto)
  if (!v) throw new Error('useSesion debe usarse dentro de SesionProvider')
  return v
}
