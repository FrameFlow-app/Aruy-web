import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from './api'
import { IconoCampana } from './iconos'
import { totalNoLeidos } from './utilidades'
import { useRefrescoVisible } from './useRefrescoVisible'
import './solicitudes.css'

export const INTERVALO_CAMPANA_MS = 30_000

/** Campana del encabezado: lleva a «Mis solicitudes» y avisa con una insignia si hay novedades. */
export function CampanaSolicitudes() {
  const [total, setTotal] = useState(0)

  const consultar = useCallback(() => {
    api
      .resumenSolicitudes()
      .then((r) => setTotal(totalNoLeidos(r)))
      .catch(() => {
        // Sin conexión un momento: se queda el número anterior.
      })
  }, [])

  useEffect(() => {
    consultar()
  }, [consultar])
  useRefrescoVisible(consultar, INTERVALO_CAMPANA_MS)

  const texto = total > 9 ? '9+' : String(total)
  return (
    <Link
      to="/solicitudes"
      className="campana"
      aria-label={total > 0 ? `Mis solicitudes, ${total} sin leer` : 'Mis solicitudes'}
    >
      <IconoCampana />
      {total > 0 && (
        <span className="campana__insignia" aria-hidden="true">
          {texto}
        </span>
      )}
    </Link>
  )
}
