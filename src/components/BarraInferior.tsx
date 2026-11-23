import { NavLink } from 'react-router-dom'
import { useSesion } from '../api/SesionContexto'
import { IconoExplorar, IconoMaletin, IconoPanel, IconoPortafolio } from '../features/prestador/iconos'
import { IconoBuscar, IconoCuenta, IconoInicio } from './Iconos'
import './BarraInferior.css'

/**
 * Barra flotante en píldora, como NavegacionFlotante de Android.
 * Contratante e invitado: Inicio, Buscar y Cuenta/Ingresar.
 * Prestador: Panel, Servicios, Portafolio, Explorar y Cuenta.
 */
export function BarraInferior() {
  const { sesion } = useSesion()
  const esPrestador = sesion?.usuario.rol === 'PRESTADOR'
  const items = esPrestador
    ? [
        { a: '/panel', titulo: 'Panel', icono: <IconoPanel /> },
        { a: '/servicios', titulo: 'Servicios', icono: <IconoMaletin /> },
        { a: '/portafolio', titulo: 'Portafolio', icono: <IconoPortafolio /> },
        { a: '/inicio', titulo: 'Explorar', icono: <IconoExplorar /> },
        { a: '/cuenta', titulo: 'Cuenta', icono: <IconoCuenta /> },
      ]
    : [
        { a: '/inicio', titulo: 'Inicio', icono: <IconoInicio /> },
        { a: '/buscar', titulo: 'Buscar', icono: <IconoBuscar /> },
        sesion
          ? { a: '/cuenta', titulo: 'Cuenta', icono: <IconoCuenta /> }
          : { a: '/ingresar', titulo: 'Ingresar', icono: <IconoCuenta /> },
      ]
  return (
    <nav className="barra" aria-label="Principal">
      <ul className={`barra__lista ${esPrestador ? 'barra__lista--cinco' : ''}`.trim()}>
        {items.map((it) => (
          <li key={it.a}>
            <NavLink to={it.a} className={({ isActive }) => `barra__item ${isActive ? 'barra__item--activo' : ''}`}>
              {it.icono}
              <span>{it.titulo}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
