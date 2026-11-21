import type { ButtonHTMLAttributes, ReactNode } from 'react'
import './Boton.css'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'texto' | 'peligro'
  cargando?: boolean
  grande?: boolean
  ancho?: boolean
  icono?: ReactNode
}

export function Boton({
  variante = 'primario',
  cargando = false,
  grande = false,
  ancho = false,
  icono,
  disabled,
  className = '',
  children,
  type = 'button',
  ...resto
}: Props) {
  const clases = ['boton', `boton--${variante}`, grande && 'boton--grande', ancho && 'boton--ancho', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button
      type={type}
      className={clases}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      {...resto}
    >
      {cargando ? <span className="boton__giro" role="status" aria-label="Cargando" /> : icono}
      <span>{children}</span>
    </button>
  )
}
