import type { Opinion } from '../../api/tipos'
import { Calificacion } from './Insignias'
import { formatoPromedio } from './filtros'
import { IconoEstrella } from './iconos'
import './catalogo.css'

function fechaCorta(iso: string | null): string {
  if (!iso) return ''
  const f = new Date(iso)
  return Number.isNaN(f.getTime()) ? '' : f.toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  promedio: number | null
  total: number
  opiniones: Opinion[]
  /** Máximo de opiniones a mostrar. */
  limite?: number
}

export function Opiniones({ promedio, total, opiniones, limite = 5 }: Props) {
  if (total === 0 || opiniones.length === 0) {
    return <p className="texto-suave">Aún no hay opiniones. Cuando alguien califique, aparecerán aquí.</p>
  }
  return (
    <div className="opiniones">
      <div className="opiniones__resumen">
        <span className="opiniones__nota">{promedio === null ? '–' : formatoPromedio(promedio)}</span>
        <div>
          <Calificacion promedio={promedio} total={total} />
          <p className="texto-suave">
            {total} {total === 1 ? 'opinión' : 'opiniones'}
          </p>
        </div>
      </div>
      <ul className="opiniones__lista">
        {opiniones.slice(0, limite).map((o) => (
          <li key={o.id} className="opinion">
            <div className="opinion__cabecera">
              <strong>{o.contratante ?? 'Cliente de Aruy'}</strong>
              <span className="opinion__puntos" aria-label={`${o.puntuacion} de 5`}>
                <IconoEstrella tamano={14} />
                {o.puntuacion}
              </span>
            </div>
            {o.comentario && <p>{o.comentario}</p>}
            {o.fecha_creacion && <p className="opinion__fecha">{fechaCorta(o.fecha_creacion)}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
