import { useCallback, useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorApi } from '../../api/api'
import * as endpoints from '../../api/endpoints'
import { useSesion } from '../../api/SesionContexto'
import { CATEGORIAS, esCategoria, type Categoria, type FotoServicio } from '../../api/tipos'
import { Aviso } from '../../components/Aviso'
import { Boton } from '../../components/Boton'
import { Campo } from '../../components/Campo'
import { Cargando } from '../../components/Cargando'
import { Chip } from '../../components/Chip'
import { EstadoVacio } from '../../components/EstadoVacio'
import { IconoCategoria } from '../../components/Iconos'
import { invalidarCatalogo } from '../../features/catalogo/catalogo'
import { etiquetaCategoria } from '../../features/catalogo/filtros'
import { Pastilla } from '../../features/catalogo/Insignias'
import { IconoCamara, IconoPapelera } from '../../features/micuenta/iconos'
import { ErrorImagen } from '../../features/micuenta/imagen'
import { Confirmar } from '../../features/prestador-servicios/Confirmar'
import { cargarMisServicios, ordenarFotos, perfilIdPropio } from '../../features/prestador-servicios/datos'
import { FotoCasilla, type EstadoCasilla } from '../../features/prestador-servicios/FotoCasilla'
import { prepararFotoServicio } from '../../features/prestador-servicios/fotoServicio'
import {
  AVISO_MAX_SERVICIOS,
  cupoFotos,
  cupoServicios,
  DESCRIPCION_MAX,
  MAX_FOTOS,
  normalizarTitulo,
  TITULO_MAX,
  validarCategoria,
  validarDescripcion,
  validarFotos,
  validarPrecio,
  validarTitulo,
} from '../../features/prestador-servicios/validacion'
import '../../features/catalogo/catalogo.css'
import '../../features/micuenta/micuenta.css'
import '../../features/prestador-servicios/servicios.css'
import { mensajeDeError, useEnfocarPrimerError } from '../cuenta/ayudas'
import { Pantalla } from '../Pantalla'

interface Campos {
  titulo: string
  categoria: Categoria | null
  descripcion: string
  precio: string
  disponible: boolean
}

const VACIOS: Campos = { titulo: '', categoria: null, descripcion: '', precio: '', disponible: true }

interface FotoNueva {
  clave: string
  estado: EstadoCasilla | 'subida'
  blob: Blob | null
  vista: string | null
  error: string | null
}

interface Errores {
  titulo?: string
  categoria?: string
  descripcion?: string
  precio?: string
  fotos?: string
}

type Carga = 'cargando' | 'listo' | 'error' | 'ajeno' | 'lleno'

const igualesCampos = (a: Campos, b: Campos) =>
  a.titulo === b.titulo && a.categoria === b.categoria && a.descripcion === b.descripcion && a.precio === b.precio && a.disponible === b.disponible

let contador = 0
const nuevaClave = () => `n${(contador += 1)}`

const precioATexto = (p: number | null) => (p === null ? '' : String(p).replace('.', ','))

export function EditorServicio() {
  const { id: idRuta } = useParams<{ id: string }>()
  const navegar = useNavigate()
  const { sesion } = useSesion()
  const idDescripcion = useId()
  const idCategoria = useId()
  const entrada = useRef<HTMLInputElement>(null)
  const { formulario, pedir } = useEnfocarPrimerError()

  const [servicioId, setServicioId] = useState<string | null>(idRuta ?? null)
  const esNuevo = !idRuta
  const [carga, setCarga] = useState<Carga>(idRuta ? 'cargando' : 'listo')
  const [falloCarga, setFalloCarga] = useState<string | null>(null)
  const [intento, setIntento] = useState(0)

  const [campos, setCampos] = useState<Campos>(VACIOS)
  const [base, setBase] = useState<Campos>(VACIOS)
  const [errores, setErrores] = useState<Errores>({})
  const [guardadas, setGuardadas] = useState<FotoServicio[]>([])
  const [nuevas, setNuevas] = useState<FotoNueva[]>([])
  const nuevasRef = useRef<FotoNueva[]>([])
  const [falloFotos, setFalloFotos] = useState<string | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [progreso, setProgreso] = useState<string | null>(null)
  const [porQuitar, setPorQuitar] = useState<FotoServicio | null>(null)
  const [quitando, setQuitando] = useState(false)
  const [eliminarServicio, setEliminarServicio] = useState(false)
  const [eliminando, setEliminando] = useState(false)

  const actualizarNuevas = useCallback((cambio: (lista: FotoNueva[]) => FotoNueva[]) => {
    const lista = cambio(nuevasRef.current)
    nuevasRef.current = lista
    setNuevas(lista)
  }, [])

  const soltarVista = (n: FotoNueva) => {
    if (n.vista) URL.revokeObjectURL(n.vista)
  }

  // Libera las vistas previas al salir.
  useEffect(() => {
    return () => nuevasRef.current.forEach((n) => n.vista && URL.revokeObjectURL(n.vista))
  }, [])

  // Carga: en edición trae el servicio y sus fotos; en alta comprueba que quede cupo.
  useEffect(() => {
    let vigente = true
    const cargar = async () => {
      const perfilId = await perfilIdPropio(sesion?.perfilPrestadorId ?? null)
      if (!idRuta) {
        const propios = await cargarMisServicios(perfilId)
        return { perfilId, lleno: cupoServicios(propios.length).lleno }
      }
      const [s, fotos] = await Promise.all([endpoints.servicio(idRuta), endpoints.fotosServicio(idRuta)])
      return { perfilId, s, fotos }
    }
    cargar()
      .then((r) => {
        if (!vigente) return
        if ('lleno' in r) {
          setCarga(r.lleno ? 'lleno' : 'listo')
          return
        }
        if (r.s.prestador_id !== r.perfilId) {
          setCarga('ajeno')
          return
        }
        const inicial: Campos = {
          titulo: r.s.titulo,
          categoria: esCategoria(r.s.categoria) ? r.s.categoria : null,
          descripcion: r.s.descripcion,
          precio: precioATexto(r.s.precio_referencial),
          disponible: r.s.disponible,
        }
        setCampos(inicial)
        setBase(inicial)
        setGuardadas(ordenarFotos(r.fotos))
        setCarga('listo')
      })
      .catch((e: unknown) => {
        if (!vigente) return
        const noExiste = e instanceof ErrorApi && (e.estado === 404 || e.estado === 400)
        if (noExiste) setCarga('ajeno')
        else {
          setFalloCarga(mensajeDeError(e))
          setCarga('error')
        }
      })
    return () => {
      vigente = false
    }
  }, [idRuta, sesion?.perfilPrestadorId, intento])

  const hayFotosPendientes = nuevas.some((n) => n.estado !== 'subida')
  const sucio = !igualesCampos(campos, base) || hayFotosPendientes

  // Avisa si se recarga o se cierra la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!sucio) return
    const alSalir = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', alSalir)
    return () => window.removeEventListener('beforeunload', alSalir)
  }, [sucio])

  const confirmarSalida = () => !sucio || window.confirm('Tienes cambios sin guardar. ¿Quieres salir sin guardarlos?')

  // El botón «Volver» del encabezado es de Pantalla: se intercepta en la fase de captura.
  const alTocarAtras = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.encabezado__atras') && !confirmarSalida()) {
      e.stopPropagation()
      e.preventDefault()
    }
  }

  const cambiar = (parche: Partial<Campos>) => setCampos((c) => ({ ...c, ...parche }))

  const totalFotos = guardadas.length + nuevas.length
  const cupo = cupoFotos(guardadas.length, nuevas.length)

  const elegirFotos = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivos = Array.from(e.target.files ?? [])
    e.target.value = '' // permite elegir la misma foto otra vez
    if (archivos.length === 0) return
    setFalloFotos(null)
    const aceptadas = archivos.slice(0, cupo.restante)
    if (archivos.length > aceptadas.length) {
      setFalloFotos(`Solo caben ${MAX_FOTOS} fotos por servicio. Agregamos las primeras ${aceptadas.length}.`)
    }
    const entradas = aceptadas.map<FotoNueva>(() => ({ clave: nuevaClave(), estado: 'preparando', blob: null, vista: null, error: null }))
    actualizarNuevas((l) => [...l, ...entradas])
    await Promise.all(
      aceptadas.map(async (archivo, i) => {
        const { clave } = entradas[i]
        try {
          const { blob } = await prepararFotoServicio(archivo)
          const vista = URL.createObjectURL(blob)
          actualizarNuevas((l) => l.map((n) => (n.clave === clave ? { ...n, estado: 'lista', blob, vista } : n)))
        } catch (err) {
          actualizarNuevas((l) => l.filter((n) => n.clave !== clave))
          setFalloFotos(err instanceof ErrorImagen ? err.message : 'No pudimos preparar esa foto. Prueba con otra.')
        }
      }),
    )
  }

  const quitarNueva = (clave: string) => {
    const n = nuevasRef.current.find((x) => x.clave === clave)
    if (n) soltarVista(n)
    actualizarNuevas((l) => l.filter((x) => x.clave !== clave))
    setFalloFotos(null)
  }

  const quitarGuardada = async () => {
    if (!porQuitar || quitando) return
    setQuitando(true)
    setFalloFotos(null)
    try {
      await endpoints.eliminarFoto(porQuitar.id)
      setGuardadas((l) => l.filter((f) => f.id !== porQuitar.id))
      invalidarCatalogo(servicioId ?? undefined)
      setPorQuitar(null)
    } catch (err) {
      setPorQuitar(null)
      setFalloFotos(mensajeDeError(err))
    } finally {
      setQuitando(false)
    }
  }

  /** Sube una foto nueva al servicio. Devuelve true si salió bien. */
  const subirUna = async (idServicio: string, clave: string): Promise<boolean> => {
    const n = nuevasRef.current.find((x) => x.clave === clave)
    if (!n?.blob) return false
    actualizarNuevas((l) => l.map((x) => (x.clave === clave ? { ...x, estado: 'subiendo', error: null } : x)))
    try {
      const foto = await endpoints.subirFotoServicio(idServicio, n.blob)
      soltarVista(n)
      actualizarNuevas((l) => l.filter((x) => x.clave !== clave))
      setGuardadas((l) => ordenarFotos([...l, foto]))
      invalidarCatalogo(idServicio)
      return true
    } catch (err) {
      actualizarNuevas((l) => l.map((x) => (x.clave === clave ? { ...x, estado: 'error', error: mensajeDeError(err) } : x)))
      return false
    }
  }

  const reintentar = async (clave: string) => {
    if (!servicioId || guardando) return
    setGuardando(true)
    setProgreso('Subiendo la foto…')
    const ok = await subirUna(servicioId, clave)
    setProgreso(null)
    setGuardando(false)
    if (ok && nuevasRef.current.length === 0) {
      setFallo(null)
      setFalloFotos(null)
    }
  }

  const vistaTitulo = useMemo(() => normalizarTitulo(campos.titulo), [campos.titulo])

  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    if (guardando) return
    const precio = validarPrecio(campos.precio)
    const listas = nuevasRef.current.filter((n) => n.estado !== 'preparando')
    const nuevosErrores: Errores = {
      titulo: validarTitulo(campos.titulo) ?? undefined,
      categoria: validarCategoria(campos.categoria) ?? undefined,
      descripcion: validarDescripcion(campos.descripcion) ?? undefined,
      precio: precio.error ?? undefined,
      fotos: validarFotos(guardadas.length + listas.length) ?? undefined,
    }
    setErrores(nuevosErrores)
    setFallo(null)
    if (Object.values(nuevosErrores).some(Boolean)) {
      pedir()
      return
    }
    if (nuevasRef.current.some((n) => n.estado === 'preparando')) {
      setFallo('Espera un momento: todavía estamos preparando tus fotos.')
      return
    }

    const datos = {
      titulo: campos.titulo.trim(),
      descripcion: campos.descripcion.trim(),
      categoria: campos.categoria as Categoria,
      precio_referencial: precio.valor,
      disponible: campos.disponible,
    }
    setGuardando(true)
    let id = servicioId
    try {
      if (!id) {
        setProgreso('Guardando tu servicio…')
        const creado = await endpoints.crearServicio(datos)
        id = creado.id
        setServicioId(id)
        // El servidor normaliza el título: se usa siempre el que devuelve.
        const aplicados: Campos = { ...campos, titulo: creado.titulo }
        setCampos(aplicados)
        setBase(aplicados)
      } else if (!igualesCampos(campos, base)) {
        setProgreso('Guardando cambios…')
        const editado = await endpoints.editarServicio(id, datos)
        const aplicados: Campos = { ...campos, titulo: editado.titulo }
        setCampos(aplicados)
        setBase(aplicados)
      }
      invalidarCatalogo(id)
    } catch (err) {
      setProgreso(null)
      setGuardando(false)
      setFallo(mensajeDeError(err))
      return
    }

    const pendientes = nuevasRef.current.filter((n) => n.estado !== 'subida').map((n) => n.clave)
    let fallidas = 0
    for (let i = 0; i < pendientes.length; i += 1) {
      setProgreso(`Subiendo foto ${i + 1} de ${pendientes.length}…`)
      if (!(await subirUna(id, pendientes[i]))) fallidas += 1
    }
    setProgreso(null)
    setGuardando(false)

    if (fallidas > 0) {
      setFallo(
        `Guardamos tu servicio, pero ${fallidas === 1 ? 'una foto no se pudo subir' : `${fallidas} fotos no se pudieron subir`}. Toca «Reintentar» en la foto, o súbela después desde Portafolio.`,
      )
      return
    }
    navegar('/servicios', { replace: true, state: { aviso: esNuevo ? 'Publicamos tu servicio.' : 'Guardamos tus cambios.' } })
  }

  const eliminar = async () => {
    if (!servicioId || eliminando) return
    setEliminando(true)
    try {
      await endpoints.eliminarServicio(servicioId)
      invalidarCatalogo(servicioId)
      navegar('/servicios', { replace: true, state: { aviso: `Eliminamos «${base.titulo}».` } })
    } catch (err) {
      setEliminarServicio(false)
      setFallo(mensajeDeError(err))
      setEliminando(false)
    }
  }

  const titulo = esNuevo && !servicioId ? 'Nuevo servicio' : 'Editar servicio'
  const hayErrorFoto = nuevas.some((n) => n.estado === 'error')

  return (
    <div onClickCapture={alTocarAtras}>
      <Pantalla titulo={titulo} atras volverA="/servicios">
        <div className="sv-columna">
          {carga === 'cargando' && <Cargando texto="Abriendo el servicio…" />}

          {carga === 'error' && (
            <Aviso
              tipo="error"
              accion={
                <Boton
                  variante="texto"
                  onClick={() => {
                    setCarga('cargando')
                    setIntento((n) => n + 1)
                  }}
                >
                  Reintentar
                </Boton>
              }
            >
              {falloCarga}
            </Aviso>
          )}

          {carga === 'ajeno' && (
            <EstadoVacio
              titulo="No encontramos ese servicio"
              texto="Puede que ya no exista o que no sea tuyo."
              accion={
                <Link to="/servicios" className="boton boton--primario">
                  <span>Ir a mis servicios</span>
                </Link>
              }
            />
          )}

          {carga === 'lleno' && (
            <EstadoVacio
              titulo="Ya tienes tus 2 servicios"
              texto={AVISO_MAX_SERVICIOS}
              accion={
                <Link to="/servicios" className="boton boton--primario">
                  <span>Ir a mis servicios</span>
                </Link>
              }
            />
          )}

          {carga === 'listo' && (
            <form className="sv-formulario" onSubmit={guardar} noValidate ref={formulario}>
              {fallo && <Aviso tipo="error">{fallo}</Aviso>}

              <div>
                <Campo
                  etiqueta="Título del servicio"
                  name="titulo"
                  placeholder="Ejemplo: Instalación de breakers y luminarias"
                  maxLength={TITULO_MAX}
                  value={campos.titulo}
                  onChange={(e) => cambiar({ titulo: e.target.value })}
                  error={errores.titulo}
                />
                {vistaTitulo && vistaTitulo !== campos.titulo.trim() && !errores.titulo && (
                  <p className="sv-previa" aria-live="polite">
                    Se publicará como: <strong>{vistaTitulo}</strong>
                  </p>
                )}
              </div>

              <fieldset className="sv-grupo" aria-describedby={errores.categoria ? `${idCategoria}-error` : undefined}>
                <legend>Categoría</legend>
                <div className="sv-categorias">
                  {CATEGORIAS.map((c) => (
                    <Chip
                      key={c}
                      seleccionado={campos.categoria === c}
                      icono={<IconoCategoria categoria={c} tamano={18} />}
                      onClick={() => cambiar({ categoria: c })}
                      aria-invalid={errores.categoria ? true : undefined}
                    >
                      {etiquetaCategoria(c)}
                    </Chip>
                  ))}
                </div>
                {errores.categoria && (
                  <p id={`${idCategoria}-error`} className="sv-error" role="alert">
                    {errores.categoria}
                  </p>
                )}
              </fieldset>

              <div className={`campo ${errores.descripcion ? 'campo--error' : ''}`.trim()}>
                <label className="campo__etiqueta" htmlFor={idDescripcion}>
                  Descripción
                </label>
                <textarea
                  id={idDescripcion}
                  className="campo__input mc-area"
                  placeholder="Cuenta qué incluye, cómo trabajas y en qué zonas atiendes."
                  value={campos.descripcion}
                  onChange={(e) => cambiar({ descripcion: e.target.value })}
                  aria-invalid={errores.descripcion ? true : undefined}
                  aria-describedby={`${idDescripcion}-ayuda`}
                />
                <p
                  id={`${idDescripcion}-ayuda`}
                  className={`campo__mensaje ${errores.descripcion ? 'campo__mensaje--error' : ''}`.trim()}
                  role={errores.descripcion ? 'alert' : undefined}
                >
                  {errores.descripcion ?? `${campos.descripcion.length} / ${DESCRIPCION_MAX}`}
                </p>
              </div>

              <Campo
                etiqueta="Precio referencial en dólares (opcional)"
                name="precio"
                inputMode="decimal"
                placeholder="15"
                value={campos.precio}
                onChange={(e) => cambiar({ precio: e.target.value })}
                error={errores.precio}
                ayuda={
                  campos.precio.trim()
                    ? 'Es una guía; el precio final lo acuerdas por WhatsApp.'
                    : 'Si lo dejas vacío, se mostrará «Precio a convenir».'
                }
              />

              <label className="mc-interruptor">
                <span>
                  <span className="mc-fila__titulo">Disponible para nuevas solicitudes</span>
                  <span className="mc-fila__detalle">Si lo pausas, el servicio sigue visible pero marcado como no disponible.</span>
                </span>
                <input type="checkbox" role="switch" checked={campos.disponible} onChange={(e) => cambiar({ disponible: e.target.checked })} />
                <span className="mc-interruptor__pista" aria-hidden="true" />
              </label>

              <section className="sv-grupo" aria-labelledby={`${idDescripcion}-fotos`}>
                <div className="sv-fotos__cabecera">
                  <h2 id={`${idDescripcion}-fotos`} className="sv-etiqueta">
                    Fotos de tu trabajo
                  </h2>
                  <Pastilla>
                    {totalFotos} de {MAX_FOTOS}
                  </Pastilla>
                </div>
                <input
                  ref={entrada}
                  className="mc-oculto"
                  type="file"
                  accept="image/*"
                  multiple
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={(e) => void elegirFotos(e)}
                />
                <ul className="sv-casillas">
                  {guardadas.map((f, i) => (
                    <li key={f.id}>
                      <FotoCasilla
                        src={f.url}
                        alt={`Foto ${i + 1} de tu servicio`}
                        portada={i === 0}
                        nombreQuitar={`Quitar la foto ${i + 1}`}
                        onQuitar={() => setPorQuitar(f)}
                      />
                    </li>
                  ))}
                  {nuevas.map((n, i) => (
                    <li key={n.clave}>
                      <FotoCasilla
                        src={n.vista}
                        alt={`Foto nueva ${i + 1}, todavía sin subir`}
                        estado={n.estado === 'subida' ? 'lista' : n.estado}
                        mensaje={n.error}
                        portada={guardadas.length === 0 && i === 0}
                        nombreQuitar={`Quitar la foto nueva ${i + 1}`}
                        onQuitar={() => quitarNueva(n.clave)}
                        onReintentar={() => void reintentar(n.clave)}
                      />
                    </li>
                  ))}
                  {!cupo.lleno && (
                    <li>
                      <button
                        type="button"
                        className="sv-casilla-vacia sv-casilla-vacia--accion"
                        onClick={() => entrada.current?.click()}
                        disabled={guardando}
                      >
                        <span className="sv-casilla-vacia__contenido">
                          <IconoCamara width={26} height={26} />
                          {totalFotos === 0 ? 'Agregar foto' : 'Otra foto'}
                        </span>
                      </button>
                    </li>
                  )}
                  {Array.from({ length: Math.max(0, MAX_FOTOS - totalFotos - (cupo.lleno ? 0 : 1)) }, (_, i) => (
                    <li key={`vacia-${i}`} aria-hidden="true">
                      <div className="sv-casilla-vacia" />
                    </li>
                  ))}
                </ul>
                <p className="sv-nota">
                  Necesitas al menos 1 foto. Las achicamos en tu teléfono para que suban rápido; la primera es la portada.
                </p>
                {errores.fotos && (
                  <p className="sv-error" role="alert">
                    {errores.fotos}
                  </p>
                )}
                {falloFotos && <Aviso tipo="error">{falloFotos}</Aviso>}
                <div aria-live="polite">
                  {progreso && (
                    <p className="sv-progreso">
                      <span className="sv-casilla__giro" aria-hidden="true" />
                      <span>{progreso}</span>
                    </p>
                  )}
                </div>
              </section>

              <div className="sv-acciones">
                <Boton type="submit" grande ancho cargando={guardando}>
                  {guardando ? 'Guardando…' : hayErrorFoto ? 'Guardar y reintentar fotos' : esNuevo && !servicioId ? 'Publicar servicio' : 'Guardar cambios'}
                </Boton>
                {!esNuevo && servicioId && (
                  <Boton variante="texto" ancho className="sv-peligro" icono={<IconoPapelera width={18} height={18} />} disabled={guardando} onClick={() => setEliminarServicio(true)}>
                    Eliminar servicio
                  </Boton>
                )}
              </div>
            </form>
          )}
        </div>

        <Confirmar
          abierta={porQuitar !== null}
          titulo="¿Quitar esta foto?"
          texto="Se borra del servicio y del almacenamiento. No se puede deshacer."
          textoConfirmar="Quitar foto"
          ocupado={quitando}
          onConfirmar={() => void quitarGuardada()}
          onCancelar={() => setPorQuitar(null)}
        />
        <Confirmar
          abierta={eliminarServicio}
          titulo={`¿Eliminar «${base.titulo}»?`}
          texto="Dejará de aparecer en las búsquedas y se borrarán también sus fotos. No se puede deshacer."
          textoConfirmar="Eliminar servicio"
          ocupado={eliminando}
          onConfirmar={() => void eliminar()}
          onCancelar={() => setEliminarServicio(false)}
        />
      </Pantalla>
    </div>
  )
}
