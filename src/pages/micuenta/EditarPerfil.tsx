import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import * as endpoints from '../../api/endpoints'
import { useSesion } from '../../api/SesionContexto'
import type { CambiosPerfilPropio } from '../../api/tipos'
import { Avatar } from '../../components/Avatar'
import { Aviso } from '../../components/Aviso'
import { Boton } from '../../components/Boton'
import { Campo } from '../../components/Campo'
import { Cargando } from '../../components/Cargando'
import { ErrorImagen, redimensionarImagen } from '../../features/micuenta/imagen'
import { IconoCamara } from '../../features/micuenta/iconos'
import '../../features/micuenta/micuenta.css'
import { mensajeDeError, useEnfocarPrimerError } from '../cuenta/ayudas'
import { normalizarCelular, validarCelular, validarNombre } from '../cuenta/validar'
import { Pantalla } from '../Pantalla'

const OFICIO_MAX = 100
const ZONA_MAX = 100
const DESCRIPCION_MAX = 500
const ANIOS_MAX = 80

interface Errores {
  nombre?: string
  celular?: string
  oficio?: string
  zona?: string
  descripcion?: string
  anios?: string
}

interface DatosPrestador {
  oficio: string
  zona: string
  descripcion: string
  anios: string
  disponible: boolean
}

export function EditarPerfil() {
  const { sesion, actualizarUsuario } = useSesion()
  const usuario = sesion?.usuario
  const esPrestador = usuario?.rol === 'PRESTADOR'
  const idDescripcion = useId()

  const [cargando, setCargando] = useState(true)
  const [falloCarga, setFalloCarga] = useState<string | null>(null)
  const [correo, setCorreo] = useState<string>(usuario?.email ?? '')
  const [nombre, setNombre] = useState(usuario?.nombre ?? '')
  const [celular, setCelular] = useState(usuario?.telefono ?? '')
  const [prestador, setPrestador] = useState<DatosPrestador | null>(null)

  const [errores, setErrores] = useState<Errores>({})
  const [fallo, setFallo] = useState<string | null>(null)
  const [guardado, setGuardado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const { formulario, pedir } = useEnfocarPrimerError()

  const [previa, setPrevia] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [falloFoto, setFalloFoto] = useState<string | null>(null)
  const entrada = useRef<HTMLInputElement>(null)

  const [intento, setIntento] = useState(0)
  const reintentar = () => {
    setCargando(true)
    setFalloCarga(null)
    setIntento((n) => n + 1)
  }

  useEffect(() => {
    let vigente = true
    Promise.all([endpoints.miUsuario(), esPrestador ? endpoints.miPerfilPrestador().catch(() => null) : null])
      .then(([u, p]) => {
        if (!vigente) return
        setNombre(u.nombre)
        setCelular(u.telefono)
        setCorreo(u.email ?? '')
        if (p) {
          setPrestador({
            oficio: p.oficio_principal ?? '',
            zona: p.zona_cobertura ?? '',
            descripcion: p.descripcion_profesional ?? '',
            anios: p.anios_experiencia == null ? '' : String(p.anios_experiencia),
            disponible: p.disponible,
          })
        }
        setCargando(false)
      })
      .catch((e: unknown) => {
        if (!vigente) return
        setFalloCarga(mensajeDeError(e))
        setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [esPrestador, intento])

  // Libera la vista previa cuando ya no hace falta.
  useEffect(() => {
    return () => {
      if (previa) URL.revokeObjectURL(previa)
    }
  }, [previa])

  const elegirFoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    e.target.value = '' // permite elegir la misma foto otra vez
    if (!archivo || subiendo) return
    setFalloFoto(null)
    setSubiendo(true)
    try {
      const jpeg = await redimensionarImagen(archivo)
      setPrevia(URL.createObjectURL(jpeg))
      const actualizado = await endpoints.subirMiFoto(jpeg)
      actualizarUsuario(actualizado)
    } catch (err) {
      setFalloFoto(err instanceof ErrorImagen ? err.message : mensajeDeError(err))
    } finally {
      setPrevia(null)
      setSubiendo(false)
    }
  }

  const quitarFoto = async () => {
    if (subiendo) return
    setFalloFoto(null)
    setSubiendo(true)
    try {
      actualizarUsuario(await endpoints.editarMiUsuario({ foto_perfil: null }))
    } catch (err) {
      setFalloFoto(mensajeDeError(err))
    } finally {
      setSubiendo(false)
    }
  }

  const cambiarPrestador = (cambio: Partial<DatosPrestador>) =>
    setPrestador((p) => (p ? { ...p, ...cambio } : p))

  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    if (guardando) return
    const nuevos: Errores = {
      nombre: validarNombre(nombre) ?? undefined,
      celular: validarCelular(celular) ?? undefined,
    }
    let aniosNumero: number | null = null
    if (prestador) {
      if (!prestador.oficio.trim()) nuevos.oficio = 'Escribe tu oficio principal. Ejemplo: Plomero.'
      else if (prestador.oficio.trim().length > OFICIO_MAX) nuevos.oficio = `Usa máximo ${OFICIO_MAX} letras.`
      if (!prestador.zona.trim()) nuevos.zona = 'Escribe dónde atiendes. Ejemplo: Norte de Quito.'
      else if (prestador.zona.trim().length > ZONA_MAX) nuevos.zona = `Usa máximo ${ZONA_MAX} letras.`
      if (prestador.descripcion.length > DESCRIPCION_MAX) nuevos.descripcion = `Usa máximo ${DESCRIPCION_MAX} caracteres.`
      const textoAnios = prestador.anios.trim()
      if (textoAnios) {
        if (!/^\d{1,2}$/.test(textoAnios) || Number(textoAnios) > ANIOS_MAX) {
          nuevos.anios = `Escribe un número entre 0 y ${ANIOS_MAX}.`
        } else aniosNumero = Number(textoAnios)
      }
    }
    setErrores(nuevos)
    setFallo(null)
    setGuardado(false)
    if (Object.values(nuevos).some(Boolean)) {
      pedir()
      return
    }

    setGuardando(true)
    try {
      const u = await endpoints.editarMiUsuario({ nombre: nombre.trim(), telefono: normalizarCelular(celular) })
      actualizarUsuario(u)
      if (prestador) {
        const cambios: CambiosPerfilPropio = {
          oficio_principal: prestador.oficio.trim(),
          zona_cobertura: prestador.zona.trim(),
          descripcion_profesional: prestador.descripcion.trim() || null,
          anios_experiencia: aniosNumero,
          disponible: prestador.disponible,
        }
        await endpoints.editarMiPerfilPrestador(cambios)
      }
      setNombre(u.nombre)
      setCelular(u.telefono)
      setGuardado(true)
    } catch (err) {
      setFallo(mensajeDeError(err))
    } finally {
      setGuardando(false)
    }
  }

  if (!usuario) return null
  const fotoMostrada = previa ?? usuario.foto_perfil

  return (
    <Pantalla titulo="Editar perfil" atras volverA="/cuenta">
      <div className="mc-columna">
        <div className="mc-foto">
          <input
            ref={entrada}
            className="mc-oculto"
            type="file"
            accept="image/*"
            tabIndex={-1}
            aria-hidden="true"
            onChange={elegirFoto}
          />
          <button
            type="button"
            className="mc-foto__boton"
            onClick={() => entrada.current?.click()}
            disabled={subiendo}
            aria-label="Cambiar foto de perfil"
          >
            <Avatar key={fotoMostrada ?? 'sin-foto'} nombre={usuario.nombre} fotoUrl={fotoMostrada} tamano={112} />
            {subiendo ? (
              <span className="mc-foto__giro" role="status" aria-label="Subiendo tu foto" />
            ) : (
              <span className="mc-foto__camara">
                <IconoCamara />
              </span>
            )}
          </button>
          <p className="mc-foto__nota" aria-live="polite">
            {subiendo ? 'Subiendo tu foto…' : 'La foto se guarda al elegirla, sin tocar «Guardar cambios».'}
          </p>
          {usuario.foto_perfil && !subiendo && (
            <Boton variante="texto" onClick={quitarFoto}>
              Quitar foto
            </Boton>
          )}
          {falloFoto && <Aviso tipo="error">{falloFoto}</Aviso>}
        </div>

        {cargando ? (
          <div className="mc-cargando">
            <Cargando texto="Cargando tus datos…" />
          </div>
        ) : falloCarga ? (
          <Aviso
            tipo="error"
            accion={
              <Boton variante="texto" onClick={reintentar}>
                Reintentar
              </Boton>
            }
          >
            {falloCarga}
          </Aviso>
        ) : (
          <form className="mc-formulario" onSubmit={guardar} noValidate ref={formulario}>
            {fallo && <Aviso tipo="error">{fallo}</Aviso>}
            {guardado && <Aviso tipo="exito">Guardamos tus cambios.</Aviso>}

            <Campo
              etiqueta="Nombre completo"
              name="nombre"
              autoComplete="name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              error={errores.nombre}
            />
            <Campo
              etiqueta="Celular"
              name="telefono"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="0998765432"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              error={errores.celular}
              ayuda="Las personas te contactan por este número en WhatsApp."
            />
            {correo && (
              <Campo etiqueta="Correo" type="email" value={correo} disabled readOnly ayuda="El correo no se puede cambiar desde la web." />
            )}

            {prestador && (
              <section className="mc-seccion" aria-label="Datos de prestador">
                <h2>Tu trabajo</h2>
                <Campo
                  etiqueta="Oficio principal"
                  placeholder="Ejemplo: Plomero"
                  value={prestador.oficio}
                  maxLength={OFICIO_MAX}
                  onChange={(e) => cambiarPrestador({ oficio: e.target.value })}
                  error={errores.oficio}
                />
                <Campo
                  etiqueta="Dónde atiendes"
                  placeholder="Ejemplo: Norte de Quito"
                  value={prestador.zona}
                  maxLength={ZONA_MAX}
                  onChange={(e) => cambiarPrestador({ zona: e.target.value })}
                  error={errores.zona}
                />
                <div className={`campo ${errores.descripcion ? 'campo--error' : ''}`.trim()}>
                  <label className="campo__etiqueta" htmlFor={idDescripcion}>
                    Sobre ti (opcional)
                  </label>
                  <textarea
                    id={idDescripcion}
                    className="campo__input mc-area"
                    placeholder="Cuéntales a los clientes cómo trabajas."
                    value={prestador.descripcion}
                    onChange={(e) => cambiarPrestador({ descripcion: e.target.value })}
                    aria-invalid={errores.descripcion ? true : undefined}
                    aria-describedby={`${idDescripcion}-ayuda`}
                  />
                  <p
                    id={`${idDescripcion}-ayuda`}
                    className={`campo__mensaje ${errores.descripcion ? 'campo__mensaje--error' : ''}`.trim()}
                  >
                    {errores.descripcion ?? `${prestador.descripcion.length} / ${DESCRIPCION_MAX}`}
                  </p>
                </div>
                <Campo
                  etiqueta="Años de experiencia (opcional)"
                  inputMode="numeric"
                  placeholder="Ejemplo: 5"
                  value={prestador.anios}
                  onChange={(e) => cambiarPrestador({ anios: e.target.value })}
                  error={errores.anios}
                />
                <label className="mc-interruptor">
                  <span>
                    <span className="mc-fila__titulo">Estoy disponible</span>
                    <span className="mc-fila__detalle">Si lo apagas, los clientes ven que no tomas trabajos por ahora.</span>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={prestador.disponible}
                    onChange={(e) => cambiarPrestador({ disponible: e.target.checked })}
                  />
                  <span className="mc-interruptor__pista" aria-hidden="true" />
                </label>
              </section>
            )}

            <Boton type="submit" grande ancho cargando={guardando}>
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </Boton>
          </form>
        )}
      </div>
    </Pantalla>
  )
}
