import { Link, useNavigate } from 'react-router-dom'
import { useSesion } from '../../api/SesionContexto'
import { CATEGORIAS, ETIQUETA_CATEGORIA } from '../../api/tipos'
import { Boton } from '../../components/Boton'
import { IconoBuscar, IconoCategoria } from '../../components/Iconos'
import { EstadoVacio } from '../../components/EstadoVacio'
import { Tarjeta } from '../../components/Tarjeta'
import { cargarCatalogo } from '../../features/catalogo/catalogo'
import { ErrorReintentar, EsqueletosLista } from '../../features/catalogo/Cargas'
import { filtrarServicios, FILTROS_VACIOS } from '../../features/catalogo/filtros'
import { TarjetaServicio } from '../../features/catalogo/TarjetaServicio'
import { useCarga } from '../../features/catalogo/useCarga'
import { Pantalla } from '../Pantalla'
import './Inicio.css'

export function Inicio() {
  const { sesion } = useSesion()
  const navegar = useNavigate()
  const catalogo = useCarga('catalogo', () => cargarCatalogo())
  const primerNombre = sesion?.usuario.nombre.trim().split(/\s+/)[0]
  const servicios = catalogo.datos ? filtrarServicios(catalogo.datos, FILTROS_VACIOS) : []

  return (
    <Pantalla titulo={primerNombre ? `Hola, ${primerNombre}` : 'Hola'} conBarra>
      <p className="inicio__pregunta">¿Qué servicio necesitas hoy?</p>

      <Link to="/buscar" className="inicio__buscador">
        <IconoBuscar />
        <span>Busca plomero, manicure, pintura…</span>
      </Link>

      {!sesion && (
        <Tarjeta tipo="acento" className="inicio__invitado">
          <h2>Estás explorando sin cuenta</h2>
          <p>Crea una para pedir un servicio y chatear con quien lo ofrece.</p>
          <Boton onClick={() => navegar('/registro')}>Crear cuenta</Boton>
        </Tarjeta>
      )}

      <section aria-labelledby="titulo-categorias" className="inicio__seccion">
        <h2 id="titulo-categorias" className="inicio__subtitulo">
          Categorías
        </h2>
        <ul className="categorias">
          {CATEGORIAS.map((c) => (
            <li key={c}>
              <Link to={`/buscar?categoria=${c}`} className="categoria">
                <span className="categoria__icono">
                  <IconoCategoria categoria={c} />
                </span>
                {ETIQUETA_CATEGORIA[c]}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="titulo-servicios" className="inicio__seccion">
        <h2 id="titulo-servicios" className="inicio__subtitulo">
          Servicios para ti
        </h2>
        {catalogo.cargando && <EsqueletosLista lento={catalogo.lento} alto={280} />}
        {catalogo.error && (
          <ErrorReintentar mensaje={catalogo.error} estadoHttp={catalogo.estadoHttp} onReintentar={catalogo.reintentar} />
        )}
        {catalogo.datos && servicios.length === 0 && (
          <EstadoVacio titulo="Aún no hay servicios" texto="Cuando se publiquen, aparecerán aquí." />
        )}
        {servicios.length > 0 && (
          <ul className="lista-servicios">
            {servicios.map((item) => (
              <li key={item.servicio.id}>
                <TarjetaServicio item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </Pantalla>
  )
}
