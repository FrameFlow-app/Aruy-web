import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import * as endpoints from '../../api/endpoints'
import { useSesion } from '../../api/SesionContexto'
import { Aviso } from '../../components/Aviso'
import { Boton } from '../../components/Boton'
import { Cargando } from '../../components/Cargando'
import { EstadoVacio } from '../../components/EstadoVacio'
import { IconoCategoria } from '../../components/Iconos'
import { invalidarCatalogo } from '../../features/catalogo/catalogo'
import { etiquetaCategoria, textoPrecio } from '../../features/catalogo/filtros'
import { Pastilla } from '../../features/catalogo/Insignias'
import { IconoEditar, IconoPapelera } from '../../features/micuenta/iconos'
import { Confirmar } from '../../features/prestador-servicios/Confirmar'
import { useMisServicios, type ServicioPropio } from '../../features/prestador-servicios/datos'
import { IconoAgregar, IconoPausa, IconoReanudar } from '../../features/prestador-servicios/iconos'
import { AVISO_MAX_SERVICIOS, cupoServicios, MAX_SERVICIOS, textoFotos } from '../../features/prestador-servicios/validacion'
import '../../features/catalogo/catalogo.css'
import '../../features/prestador-servicios/servicios.css'
import { mensajeDeError } from '../cuenta/ayudas'
import { Pantalla } from '../Pantalla'

export function MisServicios() {
  const { sesion } = useSesion()
  const ubicacion = useLocation()
  const { estado, error, items, setItems, recargar } = useMisServicios(sesion?.perfilPrestadorId ?? null)
  const [aviso, setAviso] = useState<string | null>(() => (ubicacion.state as { aviso?: string } | null)?.aviso ?? null)
  const [fallo, setFallo] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [porEliminar, setPorEliminar] = useState<ServicioPropio | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const cupo = cupoServicios(items.length)

  const pausarOActivar = async ({ servicio }: ServicioPropio) => {
    if (ocupado) return
    setOcupado(servicio.id)
    setAviso(null)
    setFallo(null)
    try {
      const nuevo = await endpoints.editarServicio(servicio.id, { disponible: !servicio.disponible })
      setItems((lista) => lista.map((p) => (p.servicio.id === nuevo.id ? { ...p, servicio: nuevo } : p)))
      invalidarCatalogo()
      setAviso(nuevo.disponible ? `«${nuevo.titulo}» vuelve a estar activo.` : `«${nuevo.titulo}» quedó en pausa.`)
    } catch (e) {
      setFallo(mensajeDeError(e))
    } finally {
      setOcupado(null)
    }
  }

  const eliminar = async () => {
    if (!porEliminar || eliminando) return
    const { servicio } = porEliminar
    setEliminando(true)
    setFallo(null)
    try {
      await endpoints.eliminarServicio(servicio.id)
      setItems((lista) => lista.filter((p) => p.servicio.id !== servicio.id))
      invalidarCatalogo(servicio.id)
      setAviso(`Eliminamos «${servicio.titulo}».`)
      setPorEliminar(null)
    } catch (e) {
      setPorEliminar(null)
      setFallo(mensajeDeError(e))
    } finally {
      setEliminando(false)
    }
  }

  return (
    <Pantalla titulo="Mis servicios" atras conBarra>
      <div className="sv-columna">
        {aviso && <Aviso tipo="exito">{aviso}</Aviso>}
        {fallo && <Aviso tipo="error">{fallo}</Aviso>}

        {estado === 'cargando' && <Cargando texto="Cargando tus servicios…" />}

        {estado === 'error' && (
          <EstadoVacio
            titulo="No pudimos cargar tus servicios"
            texto={error ?? undefined}
            accion={<Boton onClick={recargar}>Reintentar</Boton>}
          />
        )}

        {estado === 'listo' && items.length === 0 && (
          <EstadoVacio
            titulo="Aún no publicas servicios"
            texto="Cuéntales a tus futuros clientes qué haces, cuánto cobras y muéstrales tu trabajo."
            accion={
              <Link to="/servicios/nuevo" className="boton boton--primario boton--grande">
                <span>Publicar mi primer servicio</span>
              </Link>
            }
          />
        )}

        {estado === 'listo' && items.length > 0 && (
          <>
            <div className="sv-intro">
              <div className="sv-cupo">
                <p>
                  {items.length} de {MAX_SERVICIOS} servicios
                </p>
              </div>
              <div className="sv-publicar">
                {cupo.lleno ? (
                  <>
                    <Boton grande ancho disabled icono={<IconoAgregar />} aria-describedby="sv-limite">
                      Publicar servicio
                    </Boton>
                    <p id="sv-limite" className="sv-nota">
                      {AVISO_MAX_SERVICIOS}
                    </p>
                  </>
                ) : (
                  <Link to="/servicios/nuevo" className="boton boton--primario boton--grande boton--ancho">
                    <IconoAgregar />
                    <span>Publicar servicio</span>
                  </Link>
                )}
              </div>
            </div>

            <ul className="sv-lista" aria-label="Tus servicios">
              {items.map((propio) => {
                const { servicio, fotos } = propio
                const portada = fotos.find((f) => f.url)?.url ?? null
                const pausado = !servicio.disponible
                return (
                  <li key={servicio.id} className={`sv-tarjeta ${pausado ? 'sv-tarjeta--pausado' : ''}`.trim()}>
                    <Link to={`/servicios/${servicio.id}/editar`} className="sv-tarjeta__cuerpo">
                      <span className="sv-tarjeta__portada">
                        <IconoCategoria categoria={servicio.categoria} tamano={32} />
                        {portada && <img src={portada} alt="" loading="lazy" decoding="async" />}
                      </span>
                      <span className="sv-tarjeta__texto">
                        <h2 className="sv-tarjeta__titulo">{servicio.titulo}</h2>
                        <span className="sv-tarjeta__detalle">
                          {etiquetaCategoria(servicio.categoria)} · {textoPrecio(servicio.precio_referencial)}
                        </span>
                        <span className="sv-tarjeta__etiquetas">
                          <Pastilla tipo={pausado ? 'aviso' : 'ok'}>{pausado ? 'Pausado' : 'Publicado'}</Pastilla>
                          <Pastilla>{textoFotos(fotos.length)}</Pastilla>
                        </span>
                      </span>
                    </Link>
                    <div className="sv-tarjeta__acciones">
                      <Link to={`/servicios/${servicio.id}/editar`} className="boton boton--secundario">
                        <IconoEditar width={18} height={18} />
                        <span>Editar</span>
                      </Link>
                      <Boton
                        variante="secundario"
                        icono={pausado ? <IconoReanudar tamano={18} /> : <IconoPausa tamano={18} />}
                        cargando={ocupado === servicio.id}
                        disabled={ocupado !== null}
                        onClick={() => void pausarOActivar(propio)}
                        aria-label={`${pausado ? 'Activar' : 'Pausar'} ${servicio.titulo}`}
                      >
                        {pausado ? 'Activar' : 'Pausar'}
                      </Boton>
                      <Boton
                        variante="secundario"
                        className="sv-peligro"
                        icono={<IconoPapelera width={18} height={18} />}
                        disabled={ocupado !== null}
                        onClick={() => setPorEliminar(propio)}
                        aria-label={`Eliminar ${servicio.titulo}`}
                      >
                        Eliminar
                      </Boton>
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      <Confirmar
        abierta={porEliminar !== null}
        titulo={`¿Eliminar «${porEliminar?.servicio.titulo ?? ''}»?`}
        texto={
          porEliminar
            ? `Dejará de aparecer en las búsquedas y se borrarán también sus fotos (${porEliminar.fotos.length}). No se puede deshacer.`
            : ''
        }
        textoConfirmar="Eliminar servicio"
        ocupado={eliminando}
        onConfirmar={() => void eliminar()}
        onCancelar={() => setPorEliminar(null)}
      />
    </Pantalla>
  )
}
