import { NavLink } from 'react-router-dom'
import { useSesion } from '../api/SesionContexto'
import { IconoBuscar, IconoCuenta, IconoInicio } from './Iconos'
import './BarraInferior.css'

/** Barra flotante en píldora, como NavegacionFlotante de Android: Inicio, Buscar y Cuenta/Ingresar. */
export function BarraInferior() {
  const { sesion } = useSesion()
  const items = [
    { a: '/inicio', titulo: 'Inicio', icono: <IconoInicio /> },
    { a: '/buscar', titulo: 'Buscar', icono: <IconoBuscar /> },
    sesion
      ? { a: '/cuenta', titulo: 'Cuenta', icono: <IconoCuenta /> }
      : { a: '/ingresar', titulo: 'Ingresar', icono: <IconoCuenta /> },
  ]
  return (
    <nav className="barra" aria-label="Principal">
      <ul className="barra__lista">
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
