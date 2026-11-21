import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CATEGORIAS, ETIQUETA_CATEGORIA } from '../../api/tipos'
import { Chip } from '../../components/Chip'
import { EstadoVacio } from '../../components/EstadoVacio'
import { Boton } from '../../components/Boton'
import { IconoBuscar, IconoCategoria, IconoCerrar } from '../../components/Iconos'
import { cargarCatalogo } from '../../features/catalogo/catalogo'
import { ErrorReintentar, EsqueletosLista } from '../../features/catalogo/Cargas'
import {
  cantidadActivos,
  filtrarServicios,
  filtrosAQuery,
  filtrosDesdeQuery,
  formatoDinero,
  PASO_PRECIO,
  PRECIO_MIN,
  PRECIO_SIN_LIMITE,
  ZONAS,
  type Filtros,
} from '../../features/catalogo/filtros'
import { IconoFiltros } from '../../features/catalogo/iconos'
import { TarjetaServicio } from '../../features/catalogo/TarjetaServicio'
import { useCarga } from '../../features/catalogo/useCarga'
import { Pantalla } from '../Pantalla'
import './Buscar.css'

export function Buscar() {
  // Los filtros viven en la URL (#/buscar?q=...&categoria=...): así «atrás» devuelve la búsqueda tal cual.
  const [params, setParams] = useSearchParams()
  const filtros = filtrosDesdeQuery(params)
  const [texto, setTexto] = useState(filtros.texto)
  const [panelAbierto, setPanelAbierto] = useState(false)
  const catalogo = useCarga('catalogo', () => cargarCatalogo())

  const cambiar = (cambio: Partial<Filtros>) => setParams(filtrosAQuery({ ...filtros, ...cambio }), { replace: true })
  const limpiarTodo = () => {
    setTexto('')
    setParams(new URLSearchParams(), { replace: true })
  }

  const activos = cantidadActivos(filtros)
  const resultados = catalogo.datos ? filtrarServicios(catalogo.datos, filtros) : []
  const hayCriterios = activos > 0 || filtros.texto.trim() !== ''
  const precio = filtros.precioMax ?? PRECIO_SIN_LIMITE

  return (
    <Pantalla titulo="Buscar" conBarra>
      <div className="buscar__campo">
        <IconoBuscar />
        <input
          type="search"
          className="buscar__input"
          placeholder="Servicio, oficio o nombre"
          aria-label="Buscar servicio, oficio o nombre"
          value={texto}
          autoComplete="off"
          enterKeyHint="search"
          onChange={(e) => {
            setTexto(e.target.value)
            cambiar({ texto: e.target.value })
          }}
        />
        {texto && (
          <button
            type="button"
            className="buscar__borrar"
            aria-label="Borrar búsqueda"
            onClick={() => {
              setTexto('')
              cambiar({ texto: '' })
            }}
          >
            <IconoCerrar />
          </button>
        )}
      </div>

      <div className="buscar__categorias" role="group" aria-label="Categoría">
        <Chip seleccionado={filtros.categoria === null} onClick={() => cambiar({ categoria: null })}>
          Todas
        </Chip>
        {CATEGORIAS.map((c) => (
          <Chip
            key={c}
            seleccionado={filtros.categoria === c}
            icono={<IconoCategoria categoria={c} tamano={18} />}
            onClick={() => cambiar({ categoria: filtros.categoria === c ? null : c })}
          >
            {ETIQUETA_CATEGORIA[c]}
          </Chip>
        ))}
      </div>

      <div>
        <button
          type="button"
          className="buscar__filtros-boton"
          aria-expanded={panelAbierto}
          aria-controls="panel-filtros"
          onClick={() => setPanelAbierto((v) => !v)}
        >
          <IconoFiltros />
          Más filtros{activos > 0 ? ` (${activos})` : ''}
        </button>
        {panelAbierto && (
          <div id="panel-filtros" className="buscar__panel">
            <fieldset className="buscar__grupo">
              <legend>Zona</legend>
              <div className="buscar__fila">
                <Chip seleccionado={filtros.zona === null} onClick={() => cambiar({ zona: null })}>
                  Todas
                </Chip>
                {ZONAS.map((z) => (
                  <Chip key={z} seleccionado={filtros.zona === z} onClick={() => cambiar({ zona: filtros.zona === z ? null : z })}>
                    {z}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <div className="buscar__grupo">
              <label htmlFor="precio-max">
                Precio máximo: <strong>{filtros.precioMax === null ? 'sin límite' : formatoDinero(filtros.precioMax)}</strong>
              </label>
              <input
                id="precio-max"
                type="range"
                className="buscar__rango"
                min={PRECIO_MIN}
                max={PRECIO_SIN_LIMITE}
                step={PASO_PRECIO}
                value={precio}
                aria-valuetext={filtros.precioMax === null ? 'sin límite' : formatoDinero(filtros.precioMax)}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  cambiar({ precioMax: v >= PRECIO_SIN_LIMITE ? null : v })
                }}
              />
            </div>

            <label className="buscar__interruptor">
              <input
                type="checkbox"
                checked={filtros.soloDisponibles}
                onChange={(e) => cambiar({ soloDisponibles: e.target.checked })}
              />
              <span>Solo disponibles ahora</span>
            </label>
          </div>
        )}
      </div>

      {catalogo.cargando && <EsqueletosLista lento={catalogo.lento} texto="Buscando servicios…" alto={112} />}
      {catalogo.error && (
        <ErrorReintentar mensaje={catalogo.error} estadoHttp={catalogo.estadoHttp} onReintentar={catalogo.reintentar} />
      )}
      {catalogo.datos && (
        <>
          <p className="buscar__conteo texto-suave" role="status" aria-live="polite">
            {resultados.length === 1 ? '1 servicio' : `${resultados.length} servicios`}
          </p>
          {resultados.length === 0 ? (
            <EstadoVacio
              icono={<IconoBuscar tamano={32} />}
              titulo="No encontramos servicios"
              texto="Prueba con otra palabra, otra zona o quita algún filtro."
              accion={
                hayCriterios ? (
                  <Boton variante="secundario" onClick={limpiarTodo}>
                    Quitar filtros
                  </Boton>
                ) : undefined
              }
            />
          ) : (
            <ul className="lista-servicios lista-servicios--filas">
              {resultados.map((item) => (
                <li key={item.servicio.id}>
                  <TarjetaServicio item={item} variante="fila" />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Pantalla>
  )
}
