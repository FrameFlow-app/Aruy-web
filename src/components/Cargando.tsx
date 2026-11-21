import './Cargando.css'

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <div className="cargando" role="status" aria-live="polite">
      <span className="cargando__giro" aria-hidden="true" />
      <p>{texto}</p>
    </div>
  )
}

/** Bloque gris pulsante para listas mientras llegan los datos. */
export function Esqueleto({ alto = 88, radio = 'var(--r-l)' }: { alto?: number; radio?: string }) {
  return <div className="esqueleto" style={{ height: alto, borderRadius: radio }} aria-hidden="true" />
}
