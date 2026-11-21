import { useState } from 'react'
import { ErrorApi } from '../../api/api'
import { Aviso } from '../../components/Aviso'
import { Boton } from '../../components/Boton'
import { HojaInferior } from '../../components/HojaInferior'
import * as api from './api'
import { CampoTexto } from './CampoTexto'
import { RESPUESTA_MAX, type EstadoSolicitud, type Solicitud } from './tipos'

interface Props {
  /** Solicitud y estado al que se quiere pasar; null = hoja cerrada. */
  cambio: { solicitud: Solicitud; nuevo: EstadoSolicitud } | null
  /** Debe ser estable (useCallback). */
  onCerrar: () => void
  onHecho: (original: Solicitud, actualizada: Solicitud) => void
}

const TEXTOS: Record<
  EstadoSolicitud,
  { titulo: string; boton: string; cuerpo: (n: string) => string; peligro?: boolean }
> = {
  ACEPTADA: {
    titulo: 'Aceptar la solicitud',
    boton: 'Aceptar solicitud',
    cuerpo: (n) => `${n} verá tu respuesta y podrán seguir hablando por el chat. Tu WhatsApp solo se comparte si tú lo decides.`,
  },
  RECHAZADA: {
    titulo: 'Rechazar la solicitud',
    boton: 'Rechazar solicitud',
    cuerpo: (n) => `${n} verá que no puedes ahora. Puedes explicarle por qué, es opcional.`,
    peligro: true,
  },
  CANCELADA: {
    titulo: '¿Cancelar la solicitud?',
    boton: 'Cancelar solicitud',
    cuerpo: (n) => `${n} verá que se canceló y el chat se cerrará.`,
    peligro: true,
  },
  COMPLETADA: {
    titulo: '¿Marcar como completada?',
    boton: 'Sí, completada',
    cuerpo: (n) => `Confirma que el trabajo con ${n} ya se hizo.`,
  },
  PENDIENTE: { titulo: '', boton: '', cuerpo: () => '' },
}

function Formulario({ solicitud, nuevo, onCerrar, onHecho }: { solicitud: Solicitud; nuevo: EstadoSolicitud } & Omit<Props, 'cambio'>) {
  const [respuesta, setRespuesta] = useState('')
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = TEXTOS[nuevo]
  const conRespuesta = nuevo === 'ACEPTADA' || nuevo === 'RECHAZADA'

  const confirmar = async () => {
    setTrabajando(true)
    setError(null)
    try {
      const r = await api.cambiarEstado(solicitud.id, nuevo, conRespuesta ? respuesta.trim() || undefined : undefined)
      onHecho(solicitud, r)
    } catch (e) {
      setError(e instanceof ErrorApi ? e.mensaje : 'No pudimos hacer el cambio. Prueba de nuevo.')
      setTrabajando(false)
    }
  }

  return (
    <>
      <p className="texto-suave">{t.cuerpo(solicitud.contraparte.nombre)}</p>
      {conRespuesta && (
        <CampoTexto
          etiqueta="Mensaje (opcional)"
          valor={respuesta}
          onValor={setRespuesta}
          max={RESPUESTA_MAX}
          rows={3}
          placeholder={nuevo === 'ACEPTADA' ? 'Ejemplo: puedo el sábado a las 9.' : 'Ejemplo: ese día no tengo cupo.'}
          disabled={trabajando}
        />
      )}
      {error && <Aviso tipo="error">{error}</Aviso>}
      <Boton grande ancho variante={t.peligro ? 'peligro' : 'primario'} cargando={trabajando} onClick={confirmar}>
        {t.boton}
      </Boton>
      <Boton variante="texto" onClick={onCerrar} disabled={trabajando}>
        Volver
      </Boton>
    </>
  )
}

/** Confirmación de aceptar, rechazar, cancelar o completar (con respuesta opcional al aceptar o rechazar). */
export function HojaCambioEstado({ cambio, onCerrar, onHecho }: Props) {
  return (
    <HojaInferior abierta={cambio !== null} titulo={cambio ? TEXTOS[cambio.nuevo].titulo : ''} onCerrar={onCerrar}>
      {cambio && <Formulario key={`${cambio.solicitud.id}-${cambio.nuevo}`} solicitud={cambio.solicitud} nuevo={cambio.nuevo} onCerrar={onCerrar} onHecho={onHecho} />}
    </HojaInferior>
  )
}
