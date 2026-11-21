import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useSesion } from '../../api/SesionContexto'
import type { Sesion } from '../../api/sesion'
import { Aviso } from '../../components/Aviso'
import { Avatar } from '../../components/Avatar'
import { Boton } from '../../components/Boton'
import { EstadoVacio } from '../../components/EstadoVacio'
import { ErrorReintentar, EsqueletosLista } from '../../features/catalogo/Cargas'
import { useCarga } from '../../features/catalogo/useCarga'
import * as api from '../../features/solicitudes/api'
import { EstadoChip } from '../../features/solicitudes/EstadoChip'
import { HojaCambioEstado } from '../../features/solicitudes/HojaCambioEstado'
import { IconoSolicitudes, IconoWhatsapp } from '../../features/solicitudes/iconos'
import { ETIQUETA_ESTADO, type EstadoSolicitud, type Solicitud, type TipoBandeja } from '../../features/solicitudes/tipos'
import { accionesPermitidas, combinarSolicitud, fechaRelativa, urlWhatsapp } from '../../features/solicitudes/utilidades'
import { Pantalla } from '../Pantalla'
import '../../features/solicitudes/solicitudes.css'

const TEXTO_ACCION: Record<EstadoSolicitud, string> = {
  ACEPTADA: 'Aceptar',
  RECHAZADA: 'Rechazar',
  COMPLETADA: 'Marcar completada',
  CANCELADA: 'Cancelar',
  PENDIENTE: 'Pendiente',
}

interface CambioPendiente {
  solicitud: Solicitud
  nuevo: EstadoSolicitud
}

function TarjetaSolicitud({
  solicitud,
  tipo,
  onCambiar,
}: {
  solicitud: Solicitud
  tipo: TipoBandeja
  onCambiar: (nuevo: EstadoSolicitud) => void
}) {
  const acciones = accionesPermitidas(solicitud.estado, tipo === 'recibidas')
  const sinLeer = solicitud.mensajes_sin_leer
  const enlaceWa = solicitud.whatsapp_compartido
    ? urlWhatsapp(
        solicitud.contraparte.telefono,
        `Hola ${solicitud.contraparte.nombre}, te escribo por «${solicitud.servicio_titulo ?? 'tu servicio'}» en Aruy.`,
      )
    : null

  return (
    <article className={`sol ${sinLeer > 0 || solicitud.sin_ver ? 'sol--nueva' : ''}`}>
      <div className="sol__cabeza">
        <Avatar nombre={solicitud.contraparte.nombre} fotoUrl={solicitud.contraparte.foto_perfil} tamano={48} />
        <div className="sol__quien">
          <h2 className="sol__nombre">
            <Link to={`/solicitudes/${solicitud.id}`} className="sol__enlace">
              {solicitud.contraparte.nombre}
            </Link>
          </h2>
          <p className="sol__servicio">{solicitud.servicio_titulo ?? 'Servicio eliminado'}</p>
        </div>
        <div className="sol__marcas">
          <EstadoChip estado={solicitud.estado} />
          {solicitud.sin_ver && <span className="sol__nuevo">Nuevo</span>}
        </div>
      </div>

      <p className="sol__mensaje">{solicitud.mensaje}</p>
      {solicitud.respuesta && <p className="sol__respuesta">Respuesta: {solicitud.respuesta}</p>}

      {solicitud.ultimo_mensaje && (
        <p className={`sol__ultimo ${sinLeer > 0 ? 'sol__ultimo--sin-leer' : ''}`}>
          <span className="solo-lectores">Último mensaje: </span>
          {solicitud.ultimo_mensaje.texto}
        </p>
      )}

      <div className="sol__pie">
        <span className="sol__fecha">{fechaRelativa(solicitud.ultimo_mensaje?.fecha ?? solicitud.fecha_creacion)}</span>
        {sinLeer > 0 && (
          <span className="sol__sin-leer">{sinLeer === 1 ? '1 mensaje nuevo' : `${sinLeer} mensajes nuevos`}</span>
        )}
      </div>

      <div className="sol__acciones">
        <Link to={`/solicitudes/${solicitud.id}`} className="sol__chat">
          <IconoSolicitudes tamano={20} />
          Abrir chat
        </Link>
        {enlaceWa && (
          <a href={enlaceWa} target="_blank" rel="noopener noreferrer" className="sol__chat sol__chat--wa">
            <IconoWhatsapp tamano={20} />
            WhatsApp
          </a>
        )}
        {acciones.map((a) => (
          <Boton
            key={a}
            variante={a === 'ACEPTADA' || a === 'COMPLETADA' ? 'primario' : 'secundario'}
            onClick={() => onCambiar(a)}
            aria-label={`${TEXTO_ACCION[a]} la solicitud de ${solicitud.contraparte.nombre}`}
          >
            {TEXTO_ACCION[a]}
          </Boton>
        ))}
      </div>
    </article>
  )
}

function Bandeja({ sesion }: { sesion: Sesion }) {
  const esPrestador = !!sesion.perfilPrestadorId
  const [params, setParams] = useSearchParams()
  const pedida = params.get('tab')
  const tipo: TipoBandeja = esPrestador && pedida !== 'enviadas' ? 'recibidas' : 'enviadas'
  const carga = useCarga(`solicitudes:${tipo}`, () => api.listarSolicitudes(tipo))
  const [ediciones, setEdiciones] = useState<Record<string, Solicitud>>({})
  const [cambio, setCambio] = useState<CambioPendiente | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const marcadas = useRef(new Set<TipoBandeja>())
  const listo = carga.datos !== null

  // Al abrir la bandeja ya cargada se marcan como vistas (después de leer la lista, para no perder «Nuevo»).
  useEffect(() => {
    if (!listo || marcadas.current.has(tipo)) return
    marcadas.current.add(tipo)
    api.marcarVistas(tipo).catch(() => {
      marcadas.current.delete(tipo)
    })
  }, [listo, tipo])

  const elegir = (t: TipoBandeja) => {
    setExito(null)
    setParams({ tab: t }, { replace: true })
  }

  const cerrarHoja = useCallback(() => setCambio(null), [])
  const alHecho = useCallback((original: Solicitud, actualizada: Solicitud) => {
    setEdiciones((prev) => ({ ...prev, [original.id]: combinarSolicitud(original, actualizada) }))
    setCambio(null)
    setExito(`Listo: la solicitud ahora está ${ETIQUETA_ESTADO[actualizada.estado].toLowerCase()}.`)
  }, [])

  const items = (carga.datos ?? []).map((s) => ediciones[s.id] ?? s)

  return (
    <Pantalla titulo="Mis solicitudes" atras volverA="/inicio">
      {esPrestador && (
        <div className="pestanas" role="tablist" aria-label="Tipo de solicitudes">
          {(['recibidas', 'enviadas'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`pestana-${t}`}
              aria-selected={tipo === t}
              aria-controls="panel-solicitudes"
              className={`pestanas__item ${tipo === t ? 'pestanas__item--activa' : ''}`}
              onClick={() => elegir(t)}
            >
              {t === 'recibidas' ? 'Recibidas' : 'Enviadas'}
            </button>
          ))}
        </div>
      )}

      <div id="panel-solicitudes" role={esPrestador ? 'tabpanel' : undefined} aria-labelledby={esPrestador ? `pestana-${tipo}` : undefined} className="bandeja">
        {exito && <Aviso tipo="exito">{exito}</Aviso>}
        {carga.cargando && <EsqueletosLista lento={carga.lento} texto="Cargando tus solicitudes…" cantidad={3} alto={170} />}
        {carga.error && (
          <ErrorReintentar
            titulo="No pudimos cargar tus solicitudes"
            mensaje={carga.error}
            estadoHttp={carga.estadoHttp}
            onReintentar={carga.reintentar}
          />
        )}
        {carga.datos && items.length === 0 && (
          <EstadoVacio
            icono={<IconoSolicitudes tamano={32} />}
            titulo={tipo === 'recibidas' ? 'Todavía no te han pedido nada' : 'Todavía no has enviado solicitudes'}
            texto={
              tipo === 'recibidas'
                ? 'Cuando alguien pida uno de tus servicios, aparece aquí.'
                : 'Entra a un servicio y toca «Solicitar y chatear». Aquí verás qué te responden.'
            }
            accion={
              tipo === 'enviadas' ? (
                <Link to="/buscar" className="sol__chat">
                  Buscar un servicio
                </Link>
              ) : undefined
            }
          />
        )}
        {items.length > 0 && (
          <ul className="bandeja__lista">
            {items.map((s) => (
              <li key={s.id}>
                <TarjetaSolicitud solicitud={s} tipo={tipo} onCambiar={(nuevo) => setCambio({ solicitud: s, nuevo })} />
              </li>
            ))}
          </ul>
        )}
        {carga.datos && (
          <Boton variante="texto" onClick={carga.reintentar}>
            Actualizar
          </Boton>
        )}
      </div>

      <HojaCambioEstado cambio={cambio} onCerrar={cerrarHoja} onHecho={alHecho} />
    </Pantalla>
  )
}

export function MisSolicitudes() {
  const { sesion } = useSesion()
  if (!sesion) return <Navigate to={`/ingresar?volver=${encodeURIComponent('/solicitudes')}`} replace />
  return <Bandeja sesion={sesion} />
}
