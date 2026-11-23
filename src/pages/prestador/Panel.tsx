import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as endpoints from '../../api/endpoints'
import { useSesion } from '../../api/SesionContexto'
import type { PerfilPropio, Servicio } from '../../api/tipos'
import { Avatar } from '../../components/Avatar'
import { Aviso } from '../../components/Aviso'
import { Boton } from '../../components/Boton'
import { IconoCheck } from '../../components/Iconos'
import { Tarjeta } from '../../components/Tarjeta'
import { ErrorReintentar, EsqueletosLista } from '../../features/catalogo/Cargas'
import { etiquetaCategoria, textoPrecio } from '../../features/catalogo/filtros'
import { Portada } from '../../features/catalogo/Portada'
import { useCarga } from '../../features/catalogo/useCarga'
import { mensajeDeError } from '../cuenta/ayudas'
import { CampanaSolicitudes } from '../../features/solicitudes/CampanaSolicitudes'
import * as solicitudes from '../../features/solicitudes/api'
import { consumirBienvenida } from '../../features/prestador/bienvenida'
import { IconoPro } from '../../features/prestador/iconos'
import {
  MAX_SERVICIOS,
  pasosPerfil,
  porcentajePerfil,
  puedePublicarMas,
  textoPorResponder,
} from '../../features/prestador/panel'
import { Pastilla } from '../../features/catalogo/Insignias'
import { Pantalla } from '../Pantalla'
import '../../features/micuenta/micuenta.css'
import '../../features/solicitudes/solicitudes.css'
import '../../features/prestador/prestador.css'

interface DatosPanel {
  perfil: PerfilPropio
  servicios: Servicio[]
  totalFotos: number
  porResponder: number
}

async function cargarPanel(perfilIdGuardado: string | null): Promise<DatosPanel> {
  const [perfil, resumen] = await Promise.all([
    endpoints.miPerfilPrestador(),
    solicitudes.resumenSolicitudes().catch(() => null),
  ])
  const servicios = await endpoints.listarServicios(perfilIdGuardado ?? perfil.id)
  const fotos = await Promise.all(
    servicios.map((s) =>
      endpoints
        .fotosServicio(s.id)
        .then((f) => f.length)
        .catch(() => 0),
    ),
  )
  return {
    perfil,
    servicios,
    totalFotos: fotos.reduce((a, b) => a + b, 0),
    porResponder: resumen?.recibidas_pendientes ?? 0,
  }
}

function CompletaTuPerfil({ publicados, fotos }: { publicados: number; fotos: number }) {
  const pasos = pasosPerfil(publicados, fotos)
  const hechos = pasos.filter((p) => p.hecho).length
  return (
    <Tarjeta tipo="acento" className="pn-progreso" aria-labelledby="pn-completa">
      <div className="pn-progreso__cabeza">
        <h2 id="pn-completa">Completa tu perfil</h2>
        <strong>
          {hechos} de {pasos.length}
        </strong>
      </div>
      <div
        className="pn-hilo"
        role="progressbar"
        aria-label="Avance de tu perfil"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentajePerfil(pasos)}
      >
        <span className="pn-hilo__lleno" style={{ width: `${porcentajePerfil(pasos)}%` }} />
      </div>
      <ul className="pn-pasos">
        {pasos.map((p) => (
          <li key={p.texto} className={`pn-paso ${p.hecho ? 'pn-paso--hecho' : ''}`}>
            <span className="pn-paso__marca">{p.hecho && <IconoCheck tamano={14} />}</span>
            <span>
              {p.texto}
              <span className="solo-lectores">{p.hecho ? ': hecho' : ': pendiente'}</span>
            </span>
          </li>
        ))}
      </ul>
    </Tarjeta>
  )
}

export function Panel() {
  const { sesion } = useSesion()
  const navegar = useNavigate()
  const perfilId = sesion?.perfilPrestadorId ?? null
  const carga = useCarga('panel', () => cargarPanel(perfilId))
  const [bienvenida] = useState(() => consumirBienvenida())
  // Cambio optimista del interruptor; null = manda lo que dijo el servidor.
  const [recibeLocal, setRecibeLocal] = useState<boolean | null>(null)
  const [falloRecibir, setFalloRecibir] = useState<string | null>(null)

  if (!sesion) return null
  const primerNombre = sesion.usuario.nombre.trim().split(/\s+/)[0]
  const datos = carga.datos
  const recibe = recibeLocal ?? datos?.perfil.disponible ?? true

  const cambiarRecepcion = async (nuevo: boolean) => {
    const anterior = recibe
    setRecibeLocal(nuevo)
    setFalloRecibir(null)
    try {
      const actualizado = await endpoints.editarMiPerfilPrestador({ disponible: nuevo })
      setRecibeLocal(actualizado.disponible)
    } catch (e) {
      setRecibeLocal(anterior)
      setFalloRecibir(mensajeDeError(e))
    }
  }

  return (
    <Pantalla
      titulo={`Hola, ${primerNombre}`}
      conBarra
      accion={
        <div className="acciones-cabeza">
          <CampanaSolicitudes />
          <button
            type="button"
            className="acciones-cabeza__perfil"
            onClick={() => navegar('/cuenta')}
            aria-label="Mi cuenta"
          >
            <Avatar nombre={sesion.usuario.nombre} fotoUrl={sesion.usuario.foto_perfil} tamano={40} />
          </button>
        </div>
      }
    >
      <div className="pn-columna">
        <p className="pn-subtitulo">Así va tu perfil.</p>

        {bienvenida && (
          <Aviso tipo="exito">Ya ofreces servicios con Aruy. Publica el primero para que te encuentren.</Aviso>
        )}

        {carga.cargando && <EsqueletosLista lento={carga.lento} texto="Cargando tu panel…" alto={96} />}
        {carga.error && (
          <ErrorReintentar mensaje={carga.error} estadoHttp={carga.estadoHttp} onReintentar={carga.reintentar} />
        )}

        {datos && (
          <>
            {falloRecibir && <Aviso tipo="error">{falloRecibir}</Aviso>}
            <label className={`mc-interruptor pn-disp ${recibe ? 'pn-disp--on' : ''}`}>
              <span>
                <span className="mc-fila__titulo">{recibe ? 'Recibiendo solicitudes' : 'No recibes solicitudes'}</span>
                <span className="mc-fila__detalle">
                  {recibe
                    ? 'Apareces como «Disponible ahora» en las búsquedas.'
                    : 'Los clientes verán que no estás disponible por ahora.'}
                </span>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={recibe}
                onChange={(e) => void cambiarRecepcion(e.target.checked)}
              />
              <span className="mc-interruptor__pista" aria-hidden="true" />
            </label>

            <Tarjeta tipo={datos.porResponder > 0 ? 'acento' : 'normal'} className="pn-bloque" aria-labelledby="pn-solicitudes">
              <h2 id="pn-solicitudes">Solicitudes</h2>
              <p>{textoPorResponder(datos.porResponder)}</p>
              <Boton onClick={() => navegar('/solicitudes?tab=recibidas')}>Ver solicitudes</Boton>
            </Tarjeta>

            <CompletaTuPerfil publicados={datos.servicios.length} fotos={datos.totalFotos} />

            <section className="pn-seccion" aria-labelledby="pn-servicios">
              <div className="pn-seccion__cabeza">
                <h2 id="pn-servicios">Tus servicios</h2>
                {datos.servicios.length > 0 && (
                  <Link className="pn-enlace" to="/servicios">
                    Ver todos
                  </Link>
                )}
              </div>
              {datos.servicios.length === 0 ? (
                <Tarjeta tipo="contorno" className="pn-bloque">
                  <h2>Aún no publicas ningún servicio</h2>
                  <p className="texto-suave">
                    Cuéntales a tus futuros clientes qué haces, cuánto cobras y muéstrales tu trabajo.
                  </p>
                  <Boton onClick={() => navegar('/servicios/nuevo')}>Publicar mi primer servicio</Boton>
                </Tarjeta>
              ) : (
                <>
                  <ul className="pn-lista">
                    {datos.servicios.map((s) => (
                      <li key={s.id}>
                        <Link to={`/servicios/${s.id}/editar`} className="pn-servicio">
                          <div className="pn-servicio__foto">
                            <Portada servicioId={s.id} categoria={s.categoria} titulo={s.titulo} />
                          </div>
                          <div className="pn-servicio__texto">
                            <h3 className="pn-servicio__titulo">{s.titulo}</h3>
                            <span className="pn-servicio__detalle">
                              {etiquetaCategoria(s.categoria)}. {textoPrecio(s.precio_referencial)}
                            </span>
                            {!s.disponible && (
                              <span className="pn-servicio__estado">
                                <Pastilla tipo="aviso">Pausado</Pastilla>
                              </span>
                            )}
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {puedePublicarMas(datos.servicios.length) ? (
                    <Boton grande ancho onClick={() => navegar('/servicios/nuevo')}>
                      Publicar servicio
                    </Boton>
                  ) : (
                    <p className="texto-suave">
                      Puedes tener hasta {MAX_SERVICIOS} servicios. Elimina uno para publicar otro.
                    </p>
                  )}
                </>
              )}
            </section>

            <Link to="/pro" className="pn-pro">
              <span className="pn-pro__icono">
                <IconoPro />
              </span>
              <span className="pn-pro__texto">
                <strong>Aruy Pro</strong>
                <span>Mira cómo funcionará la suscripción (simulada).</span>
              </span>
            </Link>
          </>
        )}
      </div>
    </Pantalla>
  )
}
