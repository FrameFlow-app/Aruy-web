import { useEffect, useRef, useState } from 'react'
import { avisos } from '../api/endpoints'
import {
  debeMostrarMantenimiento,
  describirIntervalo,
  MENSAJE_MANTENIMIENTO_POR_DEFECTO,
  tocaConsultar,
} from '../features/micuenta/mantenimiento'
import { Boton } from './Boton'
import { HojaInferior } from './HojaInferior'
import { IconoMantenimiento } from './Iconos'

interface Datos {
  mensaje: string
  intervalo: string | null
}

/**
 * Consulta GET /avisos al abrir la app y al volver a la pestaña (como mucho una vez cada 10 minutos).
 * Si hay mantenimiento vigente lo explica. El aviso de versión no se muestra aquí: en la web lo maneja el
 * service worker (AvisoActualizacion). Si la consulta falla, no molesta.
 */
export function DialogoMantenimiento() {
  const [datos, setDatos] = useState<Datos | null>(null)
  const [abierto, setAbierto] = useState(false)
  const ultima = useRef<number | null>(null)
  const descartado = useRef<string | null>(null)

  useEffect(() => {
    let vigente = true

    const consultar = () => {
      const ahora = Date.now()
      if (!tocaConsultar(ultima.current, ahora)) return
      ultima.current = ahora
      avisos()
        .then((a) => {
          if (!vigente) return
          if (!debeMostrarMantenimiento(a, Date.now()) || !a.mantenimiento) {
            setAbierto(false)
            return
          }
          const mensaje = a.mantenimiento.mensaje?.trim() || MENSAJE_MANTENIMIENTO_POR_DEFECTO
          // Si la persona ya lo cerró, no se le vuelve a poner el mismo aviso delante.
          if (descartado.current === mensaje) return
          setDatos({ mensaje, intervalo: describirIntervalo(a.mantenimiento.inicio, a.mantenimiento.fin) })
          setAbierto(true)
        })
        .catch(() => {
          // Que falle el aviso no debe estorbar: se reintenta la próxima vez.
          ultima.current = null
        })
    }

    const alVolver = () => {
      if (document.visibilityState === 'visible') consultar()
    }

    consultar()
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      vigente = false
      // En desarrollo (StrictMode) el efecto se monta dos veces: así la segunda vuelta sí consulta.
      ultima.current = null
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [])

  const cerrar = () => {
    descartado.current = datos?.mensaje ?? null
    setAbierto(false)
  }

  return (
    <HojaInferior abierta={abierto} titulo="Estamos en mantenimiento" onCerrar={cerrar}>
      <IconoMantenimiento tamano={32} />
      <p>{datos?.mensaje}</p>
      {datos?.intervalo && <p className="texto-suave">{datos.intervalo}</p>}
      <Boton ancho onClick={cerrar}>
        Entendido
      </Boton>
    </HojaInferior>
  )
}
