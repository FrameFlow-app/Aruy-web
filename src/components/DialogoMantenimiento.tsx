import { useEffect, useState } from 'react'
import { avisos } from '../api/endpoints'
import { Boton } from './Boton'
import { HojaInferior } from './HojaInferior'
import { IconoMantenimiento } from './Iconos'

/** Al abrir la app consulta GET /avisos; si hay mantenimiento activo lo explica. Si falla, no molesta. */
export function DialogoMantenimiento() {
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    let vigente = true
    avisos()
      .then((a) => {
        if (vigente && a.mantenimiento?.activo) {
          setMensaje(a.mantenimiento.mensaje || 'Estamos mejorando Aruy. Vuelve en unos minutos.')
          setAbierto(true)
        }
      })
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [])

  return (
    <HojaInferior abierta={abierto} titulo="Estamos en mantenimiento" onCerrar={() => setAbierto(false)}>
      <IconoMantenimiento tamano={32} />
      <p>{mensaje}</p>
      <Boton ancho onClick={() => setAbierto(false)}>
        Entendido
      </Boton>
    </HojaInferior>
  )
}
