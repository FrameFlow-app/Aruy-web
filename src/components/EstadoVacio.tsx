import type { ReactNode } from 'react'
import './EstadoVacio.css'

interface Props {
  titulo: string
  texto?: string
  icono?: ReactNode
  accion?: ReactNode
}

/** Pantalla vacía o con error: dice qué pasó y qué hacer. */
export function EstadoVacio({ titulo, texto, icono, accion }: Props) {
  return (
    <div className="vacio">
      {icono && <div className="vacio__icono">{icono}</div>}
      <h2>{titulo}</h2>
      {texto && <p className="texto-suave">{texto}</p>}
      {accion}
    </div>
  )
}
