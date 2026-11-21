import type { HTMLAttributes } from 'react'
import './Tarjeta.css'

interface Props extends HTMLAttributes<HTMLElement> {
  tipo?: 'normal' | 'contorno' | 'acento' | 'advertencia' | 'error' | 'ok'
  /** Si se pasa, la tarjeta es un boton accesible. */
  onClick?: () => void
}

export function Tarjeta({ tipo = 'normal', onClick, className = '', children, ...resto }: Props) {
  const clases = `tarjeta tarjeta--${tipo} ${onClick ? 'tarjeta--toque' : ''} ${className}`.trim()
  if (onClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={clases}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick()
          }
        }}
        {...resto}
      >
        {children}
      </div>
    )
  }
  return (
    <section className={clases} {...resto}>
      {children}
    </section>
  )
}
