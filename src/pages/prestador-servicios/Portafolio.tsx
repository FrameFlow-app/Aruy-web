import { useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import * as endpoints from '../../api/endpoints'
import { useSesion } from '../../api/SesionContexto'
import { Aviso } from '../../components/Aviso'
import { Boton } from '../../components/Boton'
import { Cargando } from '../../components/Cargando'
import { EstadoVacio } from '../../components/EstadoVacio'
import { invalidarCatalogo } from '../../features/catalogo/catalogo'
import { Visor } from '../../features/catalogo/Galeria'
import { Pastilla } from '../../features/catalogo/Insignias'
import { IconoCamara } from '../../features/micuenta/iconos'
import { ErrorImagen } from '../../features/micuenta/imagen'
import { Confirmar } from '../../features/prestador-servicios/Confirmar'
import { ordenarFotos, useMisServicios } from '../../features/prestador-servicios/datos'
import { FotoCasilla } from '../../features/prestador-servicios/FotoCasilla'
import { prepararFotoServicio } from '../../features/prestador-servicios/fotoServicio'
import { IconoFotos } from '../../features/prestador-servicios/iconos'
import { cupoFotos, MAX_FOTOS, textoFotos } from '../../features/prestador-servicios/validacion'
import type { FotoServicio } from '../../api/tipos'
import '../../features/catalogo/catalogo.css'
import '../../features/micuenta/micuenta.css'
import '../../features/prestador-servicios/servicios.css'
import { mensajeDeError } from '../cuenta/ayudas'
import { Pantalla } from '../Pantalla'

export function Portafolio() {
  const { sesion } = useSesion()
  const { estado, error, items, setItems, recargar } = useMisServicios(sesion?.perfilPrestadorId ?? null)
  const entrada = useRef<HTMLInputElement>(null)
  const destino = useRef<string | null>(null)
  const [subiendo, setSubiendo] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)
  const [porQuitar, setPorQuitar] = useState<{ servicioId: string; foto: FotoServicio } | null>(null)
  const [quitando, setQuitando] = useState(false)
  const [visor, setVisor] = useState<{ servicioId: string; indice: number } | null>(null)

  const totalFotos = items.reduce((suma, p) => suma + p.fotos.length, 0)

  const pedirFoto = (servicioId: string) => {
    destino.current = servicioId
    entrada.current?.click()
  }

  const elegirFoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = '' // permite elegir la misma foto otra vez
    const servicioId = destino.current
    if (!archivo || !servicioId || subiendo) return
    setAviso(null)
    setFallo(null)
    setSubiendo(servicioId)
    try {
      const { blob } = await prepararFotoServicio(archivo)
      const foto = await endpoints.subirFotoServicio(servicioId, blob)
      setItems((lista) =>
        lista.map((p) => (p.servicio.id === servicioId ? { ...p, fotos: ordenarFotos([...p.fotos, foto]) } : p)),
      )
      invalidarCatalogo(servicioId)
      setAviso('Subimos tu foto.')
    } catch (err) {
      setFallo(err instanceof ErrorImagen ? err.message : mensajeDeError(err))
    } finally {
      setSubiendo(null)
    }
  }

  const quitar = async () => {
    if (!porQuitar || quitando) return
    const { servicioId, foto } = porQuitar
    setQuitando(true)
    setAviso(null)
    setFallo(null)
    try {
      await endpoints.eliminarFoto(foto.id)
      setItems((lista) =>
        lista.map((p) => (p.servicio.id === servicioId ? { ...p, fotos: p.fotos.filter((f) => f.id !== foto.id) } : p)),
      )
      invalidarCatalogo(servicioId)
      setAviso('Quitamos la foto.')
    } catch (err) {
      setFallo(mensajeDeError(err))
    } finally {
      setPorQuitar(null)
      setQuitando(false)
    }
  }

  const abierto = visor ? items.find((p) => p.servicio.id === visor.servicioId) : undefined

  return (
    <Pantalla titulo="Portafolio" atras conBarra>
      <div className="sv-columna">
        <input
          ref={entrada}
          className="mc-oculto"
          type="file"
          accept="image/*"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => void elegirFoto(e)}
        />

        {estado === 'cargando' && <Cargando texto="Cargando tu portafolio…" />}

        {estado === 'error' && (
          <EstadoVacio
            titulo="No pudimos cargar tu portafolio"
            texto={error ?? undefined}
            accion={<Boton onClick={recargar}>Reintentar</Boton>}
          />
        )}

        {estado === 'listo' && items.length === 0 && (
          <EstadoVacio
            icono={<IconoFotos tamano={40} />}
            titulo="Primero publica un servicio"
            texto="Las fotos de tus trabajos se suben dentro de un servicio."
            accion={
              <Link to="/servicios/nuevo" className="boton boton--primario boton--grande">
                <span>Publicar mi primer servicio</span>
              </Link>
            }
          />
        )}

        {estado === 'listo' && items.length > 0 && (
          <>
            <p className="sv-nota">Las fotos de tus trabajos generan confianza. Cada servicio admite hasta {MAX_FOTOS}.</p>
            <div className="sv-cupo">
              <h2>Tus trabajos</h2>
              <Pastilla tipo="info">{textoFotos(totalFotos)}</Pastilla>
            </div>

            <div aria-live="polite">
              {subiendo && (
                <p className="sv-progreso">
                  <span className="sv-casilla__giro" aria-hidden="true" />
                  <span>Subiendo tu foto…</span>
                </p>
              )}
              {aviso && !subiendo && <Aviso tipo="exito">{aviso}</Aviso>}
            </div>
            {fallo && <Aviso tipo="error">{fallo}</Aviso>}

            {items.map(({ servicio, fotos }) => {
              const cupo = cupoFotos(fotos.length)
              return (
                <section key={servicio.id} className="sv-grupo-foto" aria-label={`Fotos de ${servicio.titulo}`}>
                  <div className="sv-grupo-foto__cabecera">
                    <h2>{servicio.titulo}</h2>
                    <Pastilla>
                      {fotos.length} de {MAX_FOTOS}
                    </Pastilla>
                  </div>
                  {fotos.length === 0 && <p className="sv-nota">Este servicio todavía no tiene fotos.</p>}
                  <ul className="sv-casillas">
                    {fotos.map((f, i) => (
                      <li key={f.id}>
                        <FotoCasilla
                          src={f.url}
                          alt={f.descripcion?.trim() || `Foto ${i + 1} de ${servicio.titulo}`}
                          portada={i === 0}
                          nombreQuitar={`Quitar la foto ${i + 1} de ${servicio.titulo}`}
                          onQuitar={() => setPorQuitar({ servicioId: servicio.id, foto: f })}
                          onAbrir={f.url ? () => setVisor({ servicioId: servicio.id, indice: i }) : undefined}
                        />
                      </li>
                    ))}
                    {!cupo.lleno && (
                      <li>
                        <button
                          type="button"
                          className="sv-casilla-vacia sv-casilla-vacia--accion"
                          onClick={() => pedirFoto(servicio.id)}
                          disabled={subiendo !== null}
                          aria-label={`Agregar foto a ${servicio.titulo}`}
                        >
                          <span className="sv-casilla-vacia__contenido">
                            <IconoCamara width={26} height={26} />
                            Agregar foto
                          </span>
                        </button>
                      </li>
                    )}
                  </ul>
                </section>
              )
            })}
          </>
        )}
      </div>

      {visor && abierto && abierto.fotos.some((f) => f.url) && (
        <Visor
          fotos={abierto.fotos.filter((f) => f.url)}
          inicial={Math.min(visor.indice, abierto.fotos.filter((f) => f.url).length - 1)}
          titulo={abierto.servicio.titulo}
          onCerrar={() => setVisor(null)}
        />
      )}

      <Confirmar
        abierta={porQuitar !== null}
        titulo="¿Quitar esta foto?"
        texto="Se borra del servicio y del almacenamiento. No se puede deshacer."
        textoConfirmar="Quitar foto"
        ocupado={quitando}
        onConfirmar={() => void quitar()}
        onCancelar={() => setPorQuitar(null)}
      />
    </Pantalla>
  )
}
