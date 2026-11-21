import { ETIQUETA_ESTADO, type EstadoSolicitud } from './tipos'
import './solicitudes.css'

/** Chip de color del estado de una solicitud. El texto lo dice también, no solo el color. */
export function EstadoChip({ estado }: { estado: EstadoSolicitud }) {
  return <span className={`estado-chip estado-chip--${estado.toLowerCase()}`}>{ETIQUETA_ESTADO[estado] ?? estado}</span>
}
