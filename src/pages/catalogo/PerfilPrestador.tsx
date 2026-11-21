import { useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSesion } from '../../api/SesionContexto'
import * as endpoints from '../../api/endpoints'
import type { Calificaciones, PerfilPublico, Servicio } from '../../api/tipos'
import { Avatar } from '../../components/Avatar'
import { Boton } from '../../components/Boton'
import { EstadoVacio } from '../../components/EstadoVacio'
import { IconoError } from '../../components/Iconos'
import { ErrorReintentar, EsqueletosLista } from '../../features/catalogo/Cargas'
import { estaVerificado } from '../../features/catalogo/filtros'
import { Calificacion, Pastilla, SelloVerificado } from '../../features/catalogo/Insignias'
import { IconoEnviar } from '../../features/catalogo/iconos'
import { Opiniones } from '../../features/catalogo/Opiniones'
import { TarjetaServicio } from '../../features/catalogo/TarjetaServicio'
import { useCarga } from '../../features/catalogo/useCarga'
import { Pantalla } from '../Pantalla'
import './Detalle.css'

interface DatosPerfil {
  perfil: PerfilPublico
  servicios: Servicio[]
  opiniones: Calificaciones | null
}

// `:id` es el id del PERFIL de prestador (el mismo `prestador_id` que traen los servicios).
async function cargarPerfil(id: string): Promise<DatosPerfil> {
  const [perfil, servicios, opiniones] = await Promise.all([
    endpoints.perfilPublico(id),
    endpoints.listarServicios(id).catch(() => [] as Servicio[]),
    endpoints.calificaciones(id).catch(() => null),
  ])
  return { perfil, servicios, opiniones }
}

export function PerfilPrestador() {
  const { id = '' } = useParams()
  const { sesion } = useSesion()
  const navegar = useNavigate()
  const seccionServicios = useRef<HTMLElement>(null)
  const datos = useCarga(`prestador:${id}`, () => cargarPerfil(id))

  if (datos.cargando) {
    return (
      <Pantalla titulo="Perfil" atras>
        <EsqueletosLista lento={datos.lento} texto="Abriendo el perfil…" cantidad={2} alto={160} />
      </Pantalla>
    )
  }
  if (!datos.datos) {
    const noExiste = datos.estadoHttp === 404 || datos.estadoHttp === 400
    return (
      <Pantalla titulo="Perfil" atras>
        {noExiste ? (
          <EstadoVacio
            icono={<IconoError tamano={32} />}
            titulo="No encontramos este perfil"
            texto="Puede que la persona ya no esté en Aruy."
            accion={
              <Boton variante="secundario" onClick={() => navegar('/inicio', { replace: true })}>
                Ir al inicio
              </Boton>
            }
          />
        ) : (
          <ErrorReintentar
            titulo="No pudimos abrir este perfil"
            mensaje={datos.error ?? ''}
            estadoHttp={datos.estadoHttp}
            onReintentar={datos.reintentar}
          />
        )}
      </Pantalla>
    )
  }

  const { perfil, servicios, opiniones } = datos.datos
  const esPropio = !!sesion?.perfilPrestadorId && sesion.perfilPrestadorId === perfil.id
  const promedio = opiniones?.promedio ?? perfil.calificacion_promedio
  const total = opiniones?.total ?? perfil.total_calificaciones

  const solicitar = () => {
    if (!sesion) {
      navegar(`/ingresar?volver=${encodeURIComponent(`/prestador/${perfil.id}`)}`)
    } else if (servicios.length === 1) {
      navegar(`/servicio/${servicios[0].id}`)
    } else {
      seccionServicios.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <Pantalla titulo="Perfil" atras>
      <section className="perfil__cabeza" aria-labelledby="nombre-prestador">
        <div className="perfil__quien">
          <Avatar nombre={perfil.nombre} fotoUrl={perfil.foto_perfil} tamano={88} />
          <div>
            <h2 id="nombre-prestador" className="perfil__nombre">
              {perfil.nombre}
            </h2>
            {perfil.oficio_principal && <p className="perfil__oficio">{perfil.oficio_principal}</p>}
          </div>
        </div>
        <div className="detalle__pastillas">
          <Calificacion promedio={promedio} total={total} />
          {perfil.disponible ? <Pastilla tipo="ok">Disponible ahora</Pastilla> : <Pastilla tipo="aviso">No recibe solicitudes</Pastilla>}
          {estaVerificado(perfil) && <SelloVerificado />}
          {perfil.zona_cobertura && <Pastilla>Zona {perfil.zona_cobertura}</Pastilla>}
          {perfil.anios_experiencia !== null && (
            <Pastilla>
              {perfil.anios_experiencia} {perfil.anios_experiencia === 1 ? 'año' : 'años'} de experiencia
            </Pastilla>
          )}
        </div>
        {perfil.descripcion_profesional && <p className="perfil__sobre">{perfil.descripcion_profesional}</p>}
      </section>

      {!esPropio && servicios.length > 0 && (
        <Boton grande ancho icono={<IconoEnviar />} onClick={solicitar}>
          {servicios.length === 1 ? 'Solicitar este servicio' : 'Elegir un servicio'}
        </Boton>
      )}

      <section className="detalle__seccion" aria-labelledby="servicios-prestador" ref={seccionServicios}>
        <h2 id="servicios-prestador">Servicios</h2>
        {servicios.length === 0 ? (
          <p className="texto-suave">Aún no publicó servicios.</p>
        ) : (
          <ul className="lista-servicios lista-servicios--filas">
            {servicios.map((servicio) => (
              <li key={servicio.id}>
                <TarjetaServicio item={{ servicio, prestador: perfil }} variante="fila" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detalle__seccion" aria-labelledby="opiniones-prestador">
        <h2 id="opiniones-prestador">Opiniones</h2>
        <Opiniones promedio={promedio} total={total} opiniones={opiniones?.calificaciones ?? []} limite={20} />
      </section>
    </Pantalla>
  )
}
