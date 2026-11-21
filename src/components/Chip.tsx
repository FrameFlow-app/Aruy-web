import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './Chip.css'

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  seleccionado?: boolean
  onClick?: () => void
  icono?: ReactNode
}

/** Chip de filtro: activo = relleno primario; inactivo = superficie suave. */
export function Chip({ seleccionado = false, onClick, icono, children, className = '', ...resto }: Props) {
  return (
    <button
      type="button"
      aria-pressed={seleccionado}
      onClick={onClick}
      className={`chip ${seleccionado ? 'chip--activo' : ''} ${className}`.trim()}
      {...resto}
    >
      {icono}
      <span>{children}</span>
    </button>
  )
}
