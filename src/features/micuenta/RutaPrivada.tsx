import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSesion } from '../../api/SesionContexto'

/**
 * Protege rutas que piden sesión. Sin sesión lleva a Ingresar y, al entrar, regresa a donde estabas.
 * Se usa como ruta de diseño (`<Route element={<RutaPrivada />}>`) o envolviendo hijos.
 */
export function RutaPrivada({ children }: { children?: ReactNode }) {
  const { sesion } = useSesion()
  const ubicacion = useLocation()
  if (!sesion) {
    const destino = `${ubicacion.pathname}${ubicacion.search}`
    return <Navigate to={`/ingresar?volver=${encodeURIComponent(destino)}`} replace />
  }
  return children ?? <Outlet />
}
