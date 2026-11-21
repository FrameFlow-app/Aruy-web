import { Link } from 'react-router-dom'
import { IconoCategoria } from '../../components/Iconos'
import { Calificacion, Pastilla } from './Insignias'
import { Portada } from './Portada'
import { disponibleAhora, etiquetaCategoria, textoPrecio, type ServicioConPrestador } from './filtros'
import './catalogo.css'

interface Props {
  item: ServicioConPrestador
  /** «grande»: foto arriba (Inicio). «fila»: miniatura a la izquierda (listas). */
  variante?: 'grande' | 'fila'
}

export function TarjetaServicio({ item, variante = 'grande' }: Props) {
  const { servicio, prestador } = item
  const libre = disponibleAhora(item)
  return (
    <Link to={`/servicio/${servicio.id}`} className={`servicio servicio--${variante}`}>
      <div className="servicio__foto">
        <Portada servicioId={servicio.id} categoria={servicio.categoria} titulo={servicio.titulo} />
        {variante === 'grande' && (
          <span className="servicio__categoria">
            <IconoCategoria categoria={servicio.categoria} tamano={16} />
            {etiquetaCategoria(servicio.categoria)}
          </span>
        )}
      </div>
      <div className="servicio__texto">
        <h3 className="servicio__titulo">{servicio.titulo}</h3>
        {prestador && (
          <p className="servicio__prestador">
            {prestador.nombre}
            {prestador.zona_cobertura ? `, ${prestador.zona_cobertura}` : ''}
          </p>
        )}
        <div className="servicio__meta">
          <span className="servicio__precio">{textoPrecio(servicio.precio_referencial)}</span>
          <Calificacion promedio={prestador?.calificacion_promedio ?? null} total={prestador?.total_calificaciones ?? 0} />
        </div>
        {!libre && <Pastilla tipo="aviso">No disponible</Pastilla>}
      </div>
    </Link>
  )
}
