import { IconoActualizar, IconoCerrar } from '../../components/Iconos'
import './servicios.css'

export type EstadoCasilla = 'lista' | 'preparando' | 'subiendo' | 'error'

interface Props {
  src: string | null
  alt: string
  estado?: EstadoCasilla
  mensaje?: string | null
  /** Marca la casilla como la portada del servicio. */
  portada?: boolean
  nombreQuitar: string
  onQuitar?: () => void
  onReintentar?: () => void
  onAbrir?: () => void
}

/** Casilla cuadrada de una foto: estado de subida, botón de quitar y, si falló, «Reintentar». */
export function FotoCasilla({ src, alt, estado = 'lista', mensaje, portada, nombreQuitar, onQuitar, onReintentar, onAbrir }: Props) {
  const ocupada = estado === 'preparando' || estado === 'subiendo'
  const imagen = src ? <img src={src} alt={alt} decoding="async" draggable={false} /> : null
  return (
    <div className={`sv-casilla sv-casilla--${estado}`}>
      {onAbrir ? (
        <button type="button" className="sv-casilla__abrir" onClick={onAbrir} aria-label={`Ver a pantalla completa: ${alt}`}>
          {imagen}
        </button>
      ) : (
        imagen
      )}
      {portada && <span className="sv-casilla__portada">Portada</span>}
      {ocupada && (
        <div className="sv-casilla__velo">
          <span className="sv-casilla__giro" aria-hidden="true" />
          <span>{estado === 'preparando' ? 'Preparando' : 'Subiendo'}</span>
        </div>
      )}
      {estado === 'error' && (
        <div className="sv-casilla__velo sv-casilla__velo--error">
          <span>{mensaje ?? 'No se subió'}</span>
          {onReintentar && (
            <button type="button" className="sv-casilla__reintentar" onClick={onReintentar}>
              <IconoActualizar tamano={18} />
              Reintentar
            </button>
          )}
        </div>
      )}
      {onQuitar && !ocupada && (
        <button type="button" className="sv-casilla__quitar" onClick={onQuitar} aria-label={nombreQuitar}>
          <span aria-hidden="true">
            <IconoCerrar tamano={16} />
          </span>
        </button>
      )}
    </div>
  )
}
