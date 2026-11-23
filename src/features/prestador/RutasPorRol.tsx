import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSesion } from '../../api/SesionContexto'
import type { Rol } from '../../api/tipos'
import { redireccionPorRol } from './guardas'

function RutaPorRol({ requerido, children }: { requerido: Rol; children?: ReactNode }) {
  const { sesion } = useSesion()
  const ubicacion = useLocation()
  const destino = redireccionPorRol(sesion?.usuario.rol, requerido, `${ubicacion.pathname}${ubicacion.search}`)
  if (destino) return <Navigate to={destino} replace />
  return children ?? <Outlet />
}

/**
 * Solo PRESTADOR. Sin sesión lleva a Ingresar (con `volver`); un contratante va a Inicio.
 * Úsala como ruta de diseño (`<Route element={<RutaSoloPrestador />}>`) o envolviendo hijos.
 */
export function RutaSoloPrestador({ children }: { children?: ReactNode }) {
  return <RutaPorRol requerido="PRESTADOR">{children}</RutaPorRol>
}

/** Solo CONTRATANTE con sesión. Un prestador va a su Panel. */
export function RutaSoloContratante({ children }: { children?: ReactNode }) {
  return <RutaPorRol requerido="CONTRATANTE">{children}</RutaPorRol>
}
