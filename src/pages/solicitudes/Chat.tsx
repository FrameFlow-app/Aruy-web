import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ErrorApi } from '../../api/api'
import { useSesion } from '../../api/SesionContexto'
import type { Sesion } from '../../api/sesion'
import { Aviso } from '../../components/Aviso'
import { Avatar } from '../../components/Avatar'
import { Boton } from '../../components/Boton'
import { HojaInferior } from '../../components/HojaInferior'
import { IconoAtras } from '../../components/Iconos'
import { ErrorReintentar, EsqueletosLista } from '../../features/catalogo/Cargas'
import { IconoEnviar } from '../../features/catalogo/iconos'
import { useCarga } from '../../features/catalogo/useCarga'
import * as api from '../../features/solicitudes/api'
import { EstadoChip } from '../../features/solicitudes/EstadoChip'
import { IconoWhatsapp } from '../../features/solicitudes/iconos'
import {
  TEXTO_CHAT_MAX,
  type MensajeChat,
  type MensajeLocal,
  type Solicitud,
} from '../../features/solicitudes/tipos'
import { useAltoVisible } from '../../features/solicitudes/useAltoVisible'
import { useRefrescoVisible } from '../../features/solicitudes/useRefrescoVisible'
import {
  agruparPorDia,
  bandejaDe,
  chatAbierto,
  fechaRelativa,
  fusionarMensajes,
  horaCorta,
  normalizarWhatsapp,
  sinLocalesConfirmados,
  ultimaFecha,
  urlWhatsapp,
} from '../../features/solicitudes/utilidades'
import { Pantalla } from '../Pantalla'
import '../../features/solicitudes/solicitudes.css'

const INTERVALO_CHAT_MS = 8000
const CERCA_DEL_FINAL_PX = 80

interface DatosChat {
  solicitud: Solicitud
  soyPrestador: boolean
  mensajes: MensajeChat[]
}

/** El backend no tiene «una solicitud»: se busca en las bandejas del usuario. */
async function cargarChat(id: string, esPrestador: boolean): Promise<DatosChat> {
  const bandejas = esPrestador ? (['enviadas', 'recibidas'] as const) : (['enviadas'] as const)
  const [listas, mensajes] = await Promise.all([
    Promise.allSettled(bandejas.map((t) => api.listarSolicitudes(t))),
    api.listarMensajes(id),
  ])
  for (let i = 0; i < listas.length; i++) {
    const r = listas[i]
    if (r.status === 'fulfilled') {
      const solicitud = r.value.find((s) => s.id === id)
      if (solicitud) return { solicitud, soyPrestador: bandejas[i] === 'recibidas', mensajes }
    }
  }
  const fallo = listas.find((r) => r.status === 'rejected')
  if (fallo && fallo.status === 'rejected') throw fallo.reason
  throw new ErrorApi(404, 'No encontramos esta solicitud. Puede que ya no exista.')
}

function mensajeDeError(e: unknown, defecto: string): string {
  return e instanceof ErrorApi ? e.mensaje : defecto
}

// ---------- Compartir WhatsApp ----------

function FormularioCompartir({
  id,
  onCerrar,
  onHecho,
}: {
  id: string
  onCerrar: () => void
  onHecho: (m: MensajeChat) => void
}) {
  const [trabajando, setTrabajando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const compartir = async () => {
    setTrabajando(true)
    setError(null)
    try {
      onHecho(await api.compartirWhatsapp(id))
    } catch (e) {
      setError(mensajeDeError(e, 'No pudimos compartir tu WhatsApp. Prueba de nuevo.'))
      setTrabajando(false)
    }
  }
  return (
    <>
      <p className="texto-suave">La otra persona verá tu número y podrá escribirte por WhatsApp. Puedes dejar de responder cuando quieras.</p>
      {error && <Aviso tipo="error">{error}</Aviso>}
      <Boton grande ancho cargando={trabajando} onClick={compartir} icono={<IconoWhatsapp />}>
        Compartir mi WhatsApp
      </Boton>
      <Boton variante="texto" onClick={onCerrar} disabled={trabajando}>
        Ahora no
      </Boton>
    </>
  )
}

// ---------- Chat ----------

function ChatAbierto({ sesion, id, inicial }: { sesion: Sesion; id: string; inicial: DatosChat }) {
  const estiloVisible = useAltoVisible()
  const [solicitud, setSolicitud] = useState(inicial.solicitud)
  const soyPrestador = inicial.soyPrestador
  const [servidor, setServidor] = useState<MensajeChat[]>(inicial.mensajes)
  const [locales, setLocales] = useState<MensajeLocal[]>([])
  const [texto, setTexto] = useState('')
  const [cerradaPorServidor, setCerradaPorServidor] = useState(false)
  const [aviso, setAviso] = useState<{ tipo: 'error' | 'exito'; texto: string } | null>(null)
  const [hojaWa, setHojaWa] = useState(false)
  const [hayNuevos, setHayNuevos] = useState(false)

  const lista = useRef<HTMLDivElement>(null)
  const area = useRef<HTMLTextAreaElement>(null)
  const abajo = useRef(true)
  const forzarAbajo = useRef(true)
  const contadorLocal = useRef(0)
  const enRefresco = useRef(false)

  const nombre = solicitud.contraparte.nombre
  const abierto = chatAbierto(solicitud.estado) && !cerradaPorServidor
  const mensajeWa = [...servidor].reverse().find((m) => m.tipo === 'WHATSAPP')
  const whatsappCompartido = solicitud.whatsapp_compartido || !!mensajeWa
  const numeroWa = normalizarWhatsapp(mensajeWa?.texto) ?? normalizarWhatsapp(solicitud.contraparte.telefono)
  const saludo = `Hola ${nombre}, te escribo por «${solicitud.servicio_titulo ?? 'tu servicio'}» en Aruy.`
  const enlaceWa = whatsappCompartido && !soyPrestador ? urlWhatsapp(numeroWa, saludo) : null

  // Autoscroll al final solo si ya estabas abajo (o si acabas de enviar).
  useLayoutEffect(() => {
    const el = lista.current
    if (el && (abajo.current || forzarAbajo.current)) {
      el.scrollTop = el.scrollHeight
      abajo.current = true
    }
    forzarAbajo.current = false
  }, [servidor, locales])

  // La caja crece con el texto hasta unas 5 líneas.
  useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`
  }, [texto])

  const alDesplazar = () => {
    const el = lista.current
    if (!el) return
    abajo.current = el.scrollHeight - el.scrollTop - el.clientHeight < CERCA_DEL_FINAL_PX
    if (abajo.current) setHayNuevos(false)
  }

  const irAbajo = () => {
    const el = lista.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    setHayNuevos(false)
  }

  // Cada 8 s, solo con la pestaña visible, pide los mensajes posteriores al último que ya hay.
  const refrescar = () => {
    if (enRefresco.current) return
    enRefresco.current = true
    api
      .listarMensajes(id, ultimaFecha(servidor))
      .then((nuevos) => {
        if (nuevos.length === 0) return
        if (!abajo.current && nuevos.some((m) => !m.es_mio)) setHayNuevos(true)
        setServidor((prev) => fusionarMensajes(prev, nuevos))
        setLocales((prev) => sinLocalesConfirmados(prev, nuevos))
      })
      .catch(() => {
        // Sin conexión un momento: el siguiente intento lo corrige.
      })
      .finally(() => {
        enRefresco.current = false
      })
  }
  useRefrescoVisible(refrescar, INTERVALO_CHAT_MS)

  const ejecutarEnvio = async (local: MensajeLocal) => {
    try {
      const confirmado = await api.enviarMensaje(id, local.texto)
      setServidor((prev) => fusionarMensajes(prev, [confirmado]))
      setLocales((prev) => prev.filter((l) => l.id !== local.id))
    } catch (e) {
      if (e instanceof ErrorApi && e.estado === 409) {
        // La solicitud se cerró mientras escribías.
        setCerradaPorServidor(true)
        setLocales((prev) => prev.filter((l) => l.id !== local.id))
        setAviso({ tipo: 'error', texto: e.mensaje })
        return
      }
      setLocales((prev) => prev.map((l) => (l.id === local.id ? { ...l, estadoLocal: 'fallido' } : l)))
    }
  }

  const enviar = () => {
    const limpio = texto.trim()
    if (!abierto || limpio === '' || limpio.length > TEXTO_CHAT_MAX) return
    contadorLocal.current += 1
    const local: MensajeLocal = {
      id: `local-${contadorLocal.current}`,
      autor_id: sesion.usuario.id,
      es_mio: true,
      texto: limpio,
      tipo: 'TEXTO',
      fecha_creacion: new Date().toISOString(),
      estadoLocal: 'enviando',
    }
    forzarAbajo.current = true
    setAviso(null)
    setLocales((prev) => [...prev, local])
    setTexto('')
    void ejecutarEnvio(local)
    area.current?.focus()
  }

  const reintentar = (local: MensajeLocal) => {
    const reenviando: MensajeLocal = { ...local, estadoLocal: 'enviando' }
    setLocales((prev) => prev.map((l) => (l.id === local.id ? reenviando : l)))
    void ejecutarEnvio(reenviando)
  }

  const descartar = (local: MensajeLocal) => setLocales((prev) => prev.filter((l) => l.id !== local.id))

  const alTeclear = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter envía en escritorio; en el celular es salto de línea (el botón envía). Mayús+Enter siempre salta.
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing) return
    if (window.matchMedia('(pointer: fine)').matches) {
      e.preventDefault()
      enviar()
    }
  }

  const alCompartido = useCallback((m: MensajeChat) => {
    setServidor((prev) => fusionarMensajes(prev, [m]))
    setSolicitud((s) => ({ ...s, whatsapp_compartido: true }))
    setHojaWa(false)
    setAviso({ tipo: 'exito', texto: 'Compartiste tu WhatsApp. Ahora te pueden escribir por ahí.' })
  }, [])
  const cerrarHojaWa = useCallback(() => setHojaWa(false), [])

  const todos: Array<MensajeChat | MensajeLocal> = [...servidor, ...locales]
  const grupos = agruparPorDia(todos)
  const hayTexto = todos.some((m) => m.tipo !== 'WHATSAPP')

  return (
    <div className="chat" style={estiloVisible}>
      <header className="chat__cabeza">
        <Link to={`/solicitudes?tab=${bandejaDe(soyPrestador)}`} className="chat__atras" aria-label="Volver a mis solicitudes">
          <IconoAtras />
        </Link>
        <Avatar nombre={nombre} fotoUrl={solicitud.contraparte.foto_perfil} tamano={44} />
        <div className="chat__quien">
          <h1 className="chat__nombre">{nombre}</h1>
          <p className="chat__servicio">{solicitud.servicio_titulo ?? 'Servicio eliminado'}</p>
        </div>
        <EstadoChip estado={solicitud.estado} />
      </header>

      {enlaceWa && (
        <div className="chat__wa">
          <span className="chat__wa-icono">
            <IconoWhatsapp />
          </span>
          <div className="chat__wa-texto">
            <strong>{nombre} compartió su WhatsApp</strong>
            {numeroWa && <span>+{numeroWa}</span>}
          </div>
          <a href={enlaceWa} target="_blank" rel="noopener noreferrer" className="chat__wa-boton">
            Abrir WhatsApp
          </a>
        </div>
      )}
      {soyPrestador && whatsappCompartido && (
        <div className="chat__wa chat__wa--mia">
          <span className="chat__wa-icono">
            <IconoWhatsapp />
          </span>
          <div className="chat__wa-texto">
            <strong>Compartiste tu WhatsApp</strong>
            <span>{nombre} ya puede escribirte por ahí.</span>
          </div>
        </div>
      )}
      {soyPrestador && !whatsappCompartido && abierto && (
        <div className="chat__wa chat__wa--invita">
          <div className="chat__wa-texto">
            <strong>¿Prefieres seguir por WhatsApp?</strong>
            <span>Tú decides si compartes tu número.</span>
          </div>
          <button type="button" className="chat__wa-boton" onClick={() => setHojaWa(true)}>
            Compartir mi WhatsApp
          </button>
        </div>
      )}

      <div className="chat__zona">
        <div
          ref={lista}
          className="chat__lista"
          onScroll={alDesplazar}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Mensajes de la conversación"
        >
          <section className="chat__origen" aria-label="Solicitud original">
            <p className="chat__origen-titulo">
              {soyPrestador ? `${nombre} te pidió este servicio` : 'Tu solicitud'}
              <span> · {fechaRelativa(solicitud.fecha_creacion)}</span>
            </p>
            <p className="chat__origen-texto">{solicitud.mensaje}</p>
            {solicitud.respuesta && (
              <p className="chat__origen-respuesta">
                {soyPrestador ? 'Tu respuesta' : `Respuesta de ${nombre}`}: {solicitud.respuesta}
              </p>
            )}
          </section>

          {!hayTexto && (
            <p className="chat__vacio texto-suave">
              {abierto ? `Aún no hay mensajes. Escribe el primero y cuéntale a ${nombre} los detalles.` : 'Esta solicitud está cerrada, así que no hay mensajes.'}
            </p>
          )}

          {grupos.map((g) => (
            <div key={g.clave} className="chat__grupo">
              <p className="chat__dia">
                <span>{g.etiqueta}</span>
              </p>
              {g.mensajes.map((m) => {
                if (m.tipo === 'WHATSAPP') {
                  return (
                    <p key={m.id} className="chat__evento">
                      {m.es_mio ? 'Compartiste tu WhatsApp' : `${nombre} te compartió su WhatsApp`} · {horaCorta(m.fecha_creacion)}
                    </p>
                  )
                }
                const local = 'estadoLocal' in m ? m : null
                return (
                  <div key={m.id} className={`burbuja ${m.es_mio ? 'burbuja--mia' : 'burbuja--otra'} ${local?.estadoLocal === 'fallido' ? 'burbuja--fallida' : ''}`}>
                    <p className="burbuja__texto">{m.texto}</p>
                    <p className="burbuja__meta">
                      {local?.estadoLocal === 'enviando' ? 'Enviando…' : local?.estadoLocal === 'fallido' ? 'No se envió' : horaCorta(m.fecha_creacion)}
                    </p>
                    {local?.estadoLocal === 'fallido' && (
                      <div className="burbuja__reintento">
                        <button type="button" onClick={() => reintentar(local)}>
                          Reintentar
                        </button>
                        <button type="button" onClick={() => descartar(local)}>
                          Descartar
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
        {hayNuevos && (
          <button type="button" className="chat__nuevos" onClick={irAbajo}>
            Mensajes nuevos
          </button>
        )}
      </div>

      {aviso && (
        <div className="chat__aviso">
          <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso>
        </div>
      )}

      <form
        className="chat__caja"
        onSubmit={(e) => {
          e.preventDefault()
          enviar()
        }}
      >
        {!abierto && (
          <p className="chat__cerrado">Esta solicitud se rechazó o se canceló, así que ya no se puede escribir.</p>
        )}
        <div className="chat__fila">
          <label className="solo-lectores" htmlFor="chat-texto">
            Escribe un mensaje
          </label>
          <textarea
            id="chat-texto"
            ref={area}
            className="chat__area"
            rows={1}
            value={texto}
            maxLength={TEXTO_CHAT_MAX}
            disabled={!abierto}
            placeholder={abierto ? 'Escribe un mensaje' : 'Chat cerrado'}
            enterKeyHint="send"
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={alTeclear}
          />
          <button type="submit" className="chat__enviar" disabled={!abierto || texto.trim() === ''} aria-label="Enviar mensaje">
            <IconoEnviar tamano={22} />
          </button>
        </div>
        {abierto && texto.length >= TEXTO_CHAT_MAX * 0.9 && (
          <p className="chat__contador">
            {texto.length}/{TEXTO_CHAT_MAX}
          </p>
        )}
      </form>

      <HojaInferior abierta={hojaWa} titulo="¿Compartir tu WhatsApp?" onCerrar={cerrarHojaWa}>
        <FormularioCompartir id={id} onCerrar={cerrarHojaWa} onHecho={alCompartido} />
      </HojaInferior>
    </div>
  )
}

function CargaChat({ sesion }: { sesion: Sesion }) {
  const { id = '' } = useParams()
  const esPrestador = !!sesion.perfilPrestadorId
  const carga = useCarga(`chat:${id}`, () => cargarChat(id, esPrestador))

  if (carga.datos) return <ChatAbierto key={id} sesion={sesion} id={id} inicial={carga.datos} />
  return (
    <Pantalla titulo="Chat" atras volverA="/solicitudes">
      {carga.cargando && <EsqueletosLista lento={carga.lento} texto="Abriendo la conversación…" cantidad={3} alto={72} />}
      {carga.error && (
        <ErrorReintentar
          titulo="No pudimos abrir el chat"
          mensaje={carga.error}
          estadoHttp={carga.estadoHttp}
          onReintentar={carga.reintentar}
        />
      )}
    </Pantalla>
  )
}

export function Chat() {
  const { sesion } = useSesion()
  const { id = '' } = useParams()
  if (!sesion) return <Navigate to={`/ingresar?volver=${encodeURIComponent(`/solicitudes/${id}`)}`} replace />
  return <CargaChat sesion={sesion} />
}
