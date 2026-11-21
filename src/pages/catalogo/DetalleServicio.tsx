import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useSesion } from '../../api/SesionContexto'
import * as endpoints from '../../api/endpoints'
import type { Calificaciones, FotoServicio, PerfilPublico, Servicio } from '../../api/tipos'
import { Avatar } from '../../components/Avatar'
import { Boton } from '../../components/Boton'
import { EstadoVacio } from '../../components/EstadoVacio'
import { IconoError } from '../../components/Iconos'
import { ErrorReintentar, EsqueletosLista } from '../../features/catalogo/Cargas'
import { disponibleAhora, estaVerificado, etiquetaCategoria, textoPrecio } from '../../features/catalogo/filtros'
import { Galeria } from '../../features/catalogo/Galeria'
import { Calificacion, Pastilla, SelloVerificado } from '../../features/catalogo/Insignias'
import { IconoEnviar } from '../../features/catalogo/iconos'
import { Opiniones } from '../../features/catalogo/Opiniones'
import { useCarga } from '../../features/catalogo/useCarga'
import { HojaNuevaSolicitud } from '../../features/solicitudes/HojaNuevaSolicitud'
import { Pantalla } from '../Pantalla'
import './Detalle.css'

interface DatosDetalle {
  servicio: Servicio
  fotos: FotoServicio[]
  prestador: PerfilPublico | null
  opiniones: Calificaciones | null
}

async function cargarDetalle(id: string): Promise<DatosDetalle> {
  const [servicio, fotos] = await Promise.all([
    endpoints.servicio(id),
    endpoints.fotosServicio(id).catch(() => [] as FotoServicio[]),
  ])
  const [prestador, opiniones] = await Promise.all([
    endpoints.perfilPublico(servicio.prestador_id).catch(() => null),
    endpoints.calificaciones(servicio.prestador_id).catch(() => null),
  ])
  return { servicio, fotos: [...fotos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)), prestador, opiniones }
}

export function DetalleServicio() {
  const { id = '' } = useParams()
  const { sesion } = useSesion()
  const navegar = useNavigate()
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const cerrarHoja = useCallback(() => setHojaAbierta(false), [])
  const detalle = useCarga(`servicio:${id}`, () => cargarDetalle(id))

  if (detalle.cargando) {
    return (
      <Pantalla titulo="Servicio" atras>
        <EsqueletosLista lento={detalle.lento} texto="Abriendo el servicio…" cantidad={2} alto={220} />
      </Pantalla>
    )
  }
  if (!detalle.datos) {
    const noExiste = detalle.estadoHttp === 404 || detalle.estadoHttp === 400
    return (
      <Pantalla titulo="Servicio" atras>
        {noExiste ? (
          <EstadoVacio
            icono={<IconoError tamano={32} />}
            titulo="No encontramos este servicio"
            texto="Puede que ya no esté disponible."
            accion={
              <Boton variante="secundario" onClick={() => navegar('/inicio', { replace: true })}>
                Ir al inicio
              </Boton>
            }
          />
        ) : (
          <ErrorReintentar mensaje={detalle.error ?? ''} estadoHttp={detalle.estadoHttp} onReintentar={detalle.reintentar} />
        )}
      </Pantalla>
    )
  }

  const { servicio, fotos, prestador, opiniones } = detalle.datos
  const item = { servicio, prestador }
  const libre = disponibleAhora(item)
  const esDueno = !!sesion?.perfilPrestadorId && sesion.perfilPrestadorId === servicio.prestador_id
  const nombrePrestador = prestador?.nombre ?? 'Prestador'
  const promedio = opiniones?.promedio ?? prestador?.calificacion_promedio ?? null
  const total = opiniones?.total ?? prestador?.total_calificaciones ?? 0

  const solicitar = () => {
    if (!sesion) {
      navegar(`/ingresar?volver=${encodeURIComponent(`/servicio/${servicio.id}`)}`)
      return
    }
    setHojaAbierta(true)
  }

  return (
    <Pantalla titulo="Servicio" atras>
      <Galeria fotos={fotos} categoria={servicio.categoria} titulo={servicio.titulo} />

      <div className="detalle__cabeza">
        <h2 className="detalle__titulo">{servicio.titulo}</h2>
        <p className="detalle__precio">{textoPrecio(servicio.precio_referencial)}</p>
        <div className="detalle__pastillas">
          <Calificacion promedio={promedio} total={total} />
          {libre ? <Pastilla tipo="ok">Disponible ahora</Pastilla> : <Pastilla tipo="aviso">No recibe solicitudes</Pastilla>}
          {estaVerificado(prestador) && <SelloVerificado />}
        </div>
      </div>

      {prestador ? (
        <Link to={`/prestador/${servicio.prestador_id}`} className="detalle__prestador">
          <Avatar nombre={prestador.nombre} fotoUrl={prestador.foto_perfil} tamano={56} />
          <span className="detalle__prestador-texto">
            <strong>{prestador.nombre}</strong>
            <span>
              {[
                prestador.oficio_principal,
                prestador.anios_experiencia !== null ? `${prestador.anios_experiencia} años de experiencia` : null,
              ]
                .filter(Boolean)
                .join(' · ') || 'Ver perfil'}
            </span>
          </span>
        </Link>
      ) : (
        <Link to={`/prestador/${servicio.prestador_id}`} className="detalle__prestador">
          <Avatar nombre={nombrePrestador} tamano={56} />
          <span className="detalle__prestador-texto">
            <strong>{nombrePrestador}</strong>
            <span>Ver perfil</span>
          </span>
        </Link>
      )}

      <section className="detalle__seccion" aria-labelledby="sobre-servicio">
        <h2 id="sobre-servicio">Sobre este servicio</h2>
        <p className="detalle__descripcion">{servicio.descripcion}</p>
        <dl className="detalle__datos">
          <div>
            <dt>Categoría</dt>
            <dd>{etiquetaCategoria(servicio.categoria)}</dd>
          </div>
          {prestador?.zona_cobertura && (
            <div>
              <dt>Zona</dt>
              <dd>{prestador.zona_cobertura}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="detalle__seccion" aria-labelledby="opiniones">
        <h2 id="opiniones">Opiniones recientes</h2>
        <Opiniones promedio={promedio} total={total} opiniones={opiniones?.calificaciones ?? []} />
        {total > 5 && (
          <Link to={`/prestador/${servicio.prestador_id}`} className="detalle__ver-mas">
            Ver todas en el perfil
          </Link>
        )}
      </section>

      {!esDueno && (
        <div className="accion-fija">
          <Boton grande ancho icono={<IconoEnviar />} onClick={solicitar} disabled={!libre}>
            Solicitar y chatear
          </Boton>
          {!libre && <p className="texto-suave detalle__nota">{nombrePrestador} no recibe solicitudes por ahora.</p>}
        </div>
      )}
      <HojaNuevaSolicitud
        abierta={hojaAbierta}
        onCerrar={cerrarHoja}
        servicioId={servicio.id}
        tituloServicio={servicio.titulo}
        nombrePrestador={nombrePrestador}
        fotoPrestador={prestador?.foto_perfil}
      />
    </Pantalla>
  )
}
