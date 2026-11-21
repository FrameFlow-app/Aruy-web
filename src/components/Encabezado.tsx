import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconoAtras } from './Iconos'
import './Encabezado.css'

interface Props {
  titulo: string
  /** Muestra el botón de atrás. Sin `volverA` usa el historial. */
  atras?: boolean
  volverA?: string
  accion?: ReactNode
}

export function Encabezado({ titulo, atras = false, volverA, accion }: Props) {
  const navegar = useNavigate()
  const volver = () => {
    if (volverA) navegar(volverA)
    else if (window.history.length > 1) navegar(-1)
    else navegar('/inicio', { replace: true })
  }
  return (
    <header className="encabezado">
      {atras && (
        <button type="button" className="encabezado__atras" onClick={volver} aria-label="Volver">
          <IconoAtras />
        </button>
      )}
      <h1 className="encabezado__titulo">{titulo}</h1>
      {accion}
    </header>
  )
}
