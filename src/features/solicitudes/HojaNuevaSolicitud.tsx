import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorApi } from '../../api/api'
import { Aviso } from '../../components/Aviso'
import { Avatar } from '../../components/Avatar'
import { Boton } from '../../components/Boton'
import { HojaInferior } from '../../components/HojaInferior'
import { IconoEnviar } from '../catalogo/iconos'
import * as api from './api'
import { CampoTexto } from './CampoTexto'
import { MENSAJE_SOLICITUD_MAX, MENSAJE_SOLICITUD_MIN } from './tipos'

interface Props {
  abierta: boolean
  /** Debe ser estable (useCallback): la hoja reenfoca si cambia. */
  onCerrar: () => void
  servicioId: string
  tituloServicio: string
  nombrePrestador: string
  fotoPrestador?: string | null
}

interface Fallo {
  mensaje: string
  estado: number
}

function Formulario({ onCerrar, servicioId, tituloServicio, nombrePrestador, fotoPrestador }: Omit<Props, 'abierta'>) {
  const navegar = useNavigate()
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [fallo, setFallo] = useState<Fallo | null>(null)
  const largo = texto.trim().length
  const valido = largo >= MENSAJE_SOLICITUD_MIN && largo <= MENSAJE_SOLICITUD_MAX

  const saludo = `Hola ${nombrePrestador.split(/\s+/)[0]}, me interesa «${tituloServicio}». ¿Podrías ayudarme?`

  const enviar = async () => {
    if (!valido || enviando) return
    setEnviando(true)
    setFallo(null)
    try {
      const creada = await api.crearSolicitud(servicioId, texto.trim())
      navegar(`/solicitudes/${creada.id}`)
    } catch (e) {
      setFallo(
        e instanceof ErrorApi
          ? { mensaje: e.mensaje, estado: e.estado }
          : { mensaje: 'No pudimos enviar tu solicitud. Prueba de nuevo.', estado: 0 },
      )
      setEnviando(false)
    }
  }

  return (
    <>
      <div className="hoja-solicitud__quien">
        <Avatar nombre={nombrePrestador} fotoUrl={fotoPrestador} tamano={48} />
        <div>
          <strong>{nombrePrestador}</strong>
          <p className="texto-suave">{tituloServicio}</p>
        </div>
      </div>
      <p className="texto-suave">
        Tu mensaje le llega dentro de Aruy y seguirán hablando por el chat. Tu número solo se comparte si tú lo decides.
      </p>
      <CampoTexto
        etiqueta="¿Qué necesitas?"
        valor={texto}
        onValor={setTexto}
        max={MENSAJE_SOLICITUD_MAX}
        rows={4}
        placeholder="Ejemplo: necesito arreglar una tubería el sábado en la mañana."
        ayuda={texto === '' ? `Mínimo ${MENSAJE_SOLICITUD_MIN} caracteres` : undefined}
        disabled={enviando}
      />
      {texto === '' && (
        <Boton variante="texto" onClick={() => setTexto(saludo.slice(0, MENSAJE_SOLICITUD_MAX))}>
          Usar un saludo de ejemplo
        </Boton>
      )}
      {fallo && (
        <Aviso
          tipo="error"
          accion={
            fallo.estado === 409 ? (
              <Boton variante="texto" onClick={() => navegar('/solicitudes')}>
                Ver mis solicitudes
              </Boton>
            ) : undefined
          }
        >
          {fallo.mensaje}
        </Aviso>
      )}
      <Boton grande ancho icono={<IconoEnviar />} cargando={enviando} disabled={!valido} onClick={enviar}>
        Enviar solicitud
      </Boton>
      <Boton variante="texto" onClick={onCerrar} disabled={enviando}>
        Ahora no
      </Boton>
    </>
  )
}

/** «Solicitar y chatear»: pide un mensaje, crea la solicitud y abre su chat. */
export function HojaNuevaSolicitud({ abierta, onCerrar, ...resto }: Props) {
  return (
    <HojaInferior abierta={abierta} titulo="Pedir este servicio" onCerrar={onCerrar}>
      <Formulario onCerrar={onCerrar} {...resto} />
    </HojaInferior>
  )
}
