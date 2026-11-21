import type { ReactNode } from 'react'
import { IconoEstrella, IconoVerificado } from './iconos'
import { formatoPromedio } from './filtros'

/** Estrella con el promedio y el total, o «Nuevo en Aruy» si aún no tiene opiniones. */
export function Calificacion({ promedio, total }: { promedio: number | null; total: number }) {
  if (promedio === null || total === 0) return <span className="pastilla pastilla--info">Nuevo en Aruy</span>
  return (
    <span className="calificacion" role="img" aria-label={`Calificación ${formatoPromedio(promedio)} de 5, ${total} ${total === 1 ? 'opinión' : 'opiniones'}`}>
      <IconoEstrella tamano={16} />
      <strong>{formatoPromedio(promedio)}</strong>
      <span className="calificacion__total">({total})</span>
    </span>
  )
}

export function SelloVerificado() {
  return (
    <span className="pastilla pastilla--ok">
      <IconoVerificado tamano={16} />
      Cuenta verificada
    </span>
  )
}

export function Pastilla({ tipo = 'neutra', children }: { tipo?: 'neutra' | 'ok' | 'aviso' | 'info'; children: ReactNode }) {
  return <span className={`pastilla pastilla--${tipo}`}>{children}</span>
}
