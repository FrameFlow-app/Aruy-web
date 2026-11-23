import { useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSesion } from '../../api/SesionContexto'
import { CATEGORIAS, ETIQUETA_CATEGORIA, type Categoria } from '../../api/tipos'
import { Aviso } from '../../components/Aviso'
import { Boton } from '../../components/Boton'
import { Campo } from '../../components/Campo'
import { Chip } from '../../components/Chip'
import { IconoCategoria } from '../../components/Iconos'
import { ZONAS } from '../../features/catalogo/filtros'
import { activarPerfil, type DatosActivar } from '../../features/prestador/api'
import { marcarBienvenida } from '../../features/prestador/bienvenida'
import { RUTA_PANEL } from '../../features/prestador/rutas'
import { validarAnios } from '../../features/prestador/validar'
import { mensajeDeError, useEnfocarPrimerError } from '../cuenta/ayudas'
import { PantallaCuenta } from '../cuenta/comun'
import '../cuenta/Cuenta.css'
import '../../features/micuenta/micuenta.css'
import '../../features/prestador/prestador.css'

const DESCRIPCION_MAX = 2000

export function Ofrecer() {
  const { iniciar } = useSesion()
  const navegar = useNavigate()
  const idDescripcion = useId()
  const [oficio, setOficio] = useState<Categoria | null>(null)
  const [zona, setZona] = useState<string>(ZONAS[0])
  const [descripcion, setDescripcion] = useState('')
  const [anios, setAnios] = useState('')
  const [errores, setErrores] = useState<{ oficio?: string; anios?: string }>({})
  const [fallo, setFallo] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const { formulario, pedir } = useEnfocarPrimerError()

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (cargando) return
    const experiencia = validarAnios(anios)
    const nuevos = {
      oficio: oficio ? undefined : 'Elige qué servicio ofreces.',
      anios: experiencia.error ?? undefined,
    }
    setErrores(nuevos)
    setFallo(null)
    if (!oficio || nuevos.anios) {
      pedir()
      return
    }
    const texto = descripcion.trim()
    const datos: DatosActivar = {
      oficio_principal: ETIQUETA_CATEGORIA[oficio],
      zona_cobertura: zona,
      ...(texto ? { descripcion_profesional: texto } : {}),
      ...(experiencia.valor !== null ? { anios_experiencia: experiencia.valor } : {}),
    }
    setCargando(true)
    try {
      const r = await activarPerfil(datos)
      // El token trae el rol nuevo: reemplaza la sesión entera. La guarda de /ofrecer ya manda a /panel.
      marcarBienvenida()
      iniciar(r)
      navegar(RUTA_PANEL, { replace: true })
    } catch (err) {
      setCargando(false)
      setFallo(mensajeDeError(err))
    }
  }

  return (
    <PantallaCuenta titulo="Ofrecer mis servicios">
      <div className="cuenta__intro">
        <h2>Con esta misma cuenta</h2>
        <p className="texto-suave">
          No necesitas otro correo ni otra contraseña. Cuéntanos qué haces y empieza a publicar tus servicios.
        </p>
      </div>

      <form className="cuenta__formulario" onSubmit={enviar} noValidate ref={formulario}>
        {fallo && <Aviso tipo="error">{fallo}</Aviso>}

        <fieldset className="grupo">
          <legend className="grupo__leyenda">¿Qué servicio ofreces?</legend>
          <div className="of-lista">
            {CATEGORIAS.map((c) => (
              <Chip
                key={c}
                seleccionado={oficio === c}
                icono={<IconoCategoria categoria={c} tamano={18} />}
                aria-invalid={errores.oficio && oficio === null ? true : undefined}
                onClick={() => {
                  setOficio(c)
                  setErrores((p) => ({ ...p, oficio: undefined }))
                }}
              >
                {ETIQUETA_CATEGORIA[c]}
              </Chip>
            ))}
          </div>
          {errores.oficio && (
            <p className="of-error" role="alert">
              {errores.oficio}
            </p>
          )}
        </fieldset>

        <fieldset className="grupo">
          <legend className="grupo__leyenda">Tu zona en Quito</legend>
          <div className="grupo__chips">
            {ZONAS.map((z) => (
              <Chip key={z} seleccionado={zona === z} onClick={() => setZona(z)}>
                {z}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="campo">
          <label className="campo__etiqueta" htmlFor={idDescripcion}>
            Sobre ti (opcional)
          </label>
          <textarea
            id={idDescripcion}
            className="campo__input mc-area"
            placeholder="Cuéntales a los clientes cómo trabajas."
            maxLength={DESCRIPCION_MAX}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            aria-describedby={`${idDescripcion}-ayuda`}
          />
          <p id={`${idDescripcion}-ayuda`} className="campo__mensaje">
            {descripcion.length} / {DESCRIPCION_MAX}
          </p>
        </div>

        <Campo
          etiqueta="Años de experiencia (opcional)"
          name="anios"
          inputMode="numeric"
          placeholder="3"
          value={anios}
          maxLength={2}
          onChange={(e) => {
            setAnios(e.target.value.replace(/\D/g, '').slice(0, 2))
            setErrores((p) => ({ ...p, anios: undefined }))
          }}
          error={errores.anios}
        />

        <Boton type="submit" grande ancho cargando={cargando}>
          {cargando ? 'Activando…' : 'Activar mi perfil de prestador'}
        </Boton>
      </form>
    </PantallaCuenta>
  )
}
