import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ErrorApi } from '../../api/api'
import * as endpoints from '../../api/endpoints'
import { useSesion } from '../../api/SesionContexto'
import { CATEGORIAS, ETIQUETA_CATEGORIA, type Rol, type SolicitudRegistro } from '../../api/tipos'
import { Aviso } from '../../components/Aviso'
import { Boton } from '../../components/Boton'
import { Campo } from '../../components/Campo'
import { Chip } from '../../components/Chip'
import { destinoTrasAcceso } from '../../features/prestador/rutas'
import { mensajeDeError, useEnfocarPrimerError } from './ayudas'
import { CampoSelect } from './CampoSelect'
import { PantallaCuenta, Pasos } from './comun'
import {
  fechaMaximaNacimiento,
  normalizarCelular,
  validarCelular,
  validarConfirmacion,
  validarCorreo,
  validarFechaNacimiento,
  validarNombre,
  validarPassword,
} from './validar'
import { rutaVolverSegura } from './volver'

const ZONAS = ['Norte', 'Centro', 'Sur', 'Valles'] as const
const URL_PRIVACIDAD = 'https://frameflow-app.github.io/Aruy-app/privacidad.html'

type Errores = Partial<
  Record<'nombre' | 'correo' | 'celular' | 'fecha' | 'password' | 'confirmar' | 'oficio' | 'acepta', string>
>

export function Registro() {
  const { iniciar } = useSesion()
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const destino = rutaVolverSegura(parametros.get('volver'))
  const sufijo = parametros.get('volver') ? `?volver=${encodeURIComponent(destino)}` : ''

  const [paso, setPaso] = useState<1 | 2>(1)
  const [rol, setRol] = useState<Rol>('CONTRATANTE')
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [celular, setCelular] = useState('')
  const [fecha, setFecha] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [oficio, setOficio] = useState('')
  const [zona, setZona] = useState<string>(ZONAS[0])
  const [acepta, setAcepta] = useState(false)
  const [errores, setErrores] = useState<Errores>({})
  const [fallo, setFallo] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const { formulario, pedir } = useEnfocarPrimerError()

  const esPrestador = rol === 'PRESTADOR'

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (cargando) return
    const nuevos: Errores = {
      nombre: validarNombre(nombre) ?? undefined,
      correo: validarCorreo(correo) ?? undefined,
      celular: validarCelular(celular) ?? undefined,
      fecha: validarFechaNacimiento(fecha) ?? undefined,
      password: validarPassword(password) ?? undefined,
      confirmar: validarConfirmacion(password, confirmar) ?? undefined,
      oficio: esPrestador && !oficio ? 'Elige qué servicio ofreces.' : undefined,
      acepta: acepta ? undefined : 'Para crear tu cuenta acepta las normas.',
    }
    setErrores(nuevos)
    setFallo(null)
    if (Object.values(nuevos).some(Boolean)) {
      pedir()
      return
    }

    const datos: SolicitudRegistro = {
      nombre: nombre.trim(),
      telefono: normalizarCelular(celular),
      email: correo.trim().toLowerCase(),
      password,
      rol,
      fecha_nacimiento: fecha,
      ...(esPrestador ? { oficio_principal: oficio, zona_cobertura: zona } : {}),
    }
    setCargando(true)
    try {
      const r = await endpoints.registro(datos)
      iniciar(r)
      navegar(destinoTrasAcceso(r.usuario.rol, parametros.get('volver')), { replace: true })
    } catch (err) {
      setCargando(false)
      // El backend dice cual dato esta repetido o es invalido; se marca en su campo.
      if (err instanceof ErrorApi && err.estado >= 400 && err.estado < 500 && err.estado !== 429) {
        const m = err.mensaje.toLowerCase()
        const campo: keyof Errores | null = /correo|email/.test(m)
          ? 'correo'
          : /celular|telefono/.test(m)
            ? 'celular'
            : /mayores|fecha/.test(m)
              ? 'fecha'
              : null
        if (campo) {
          setErrores({ [campo]: err.mensaje })
          pedir()
          return
        }
      }
      setFallo(mensajeDeError(err))
    }
  }

  if (paso === 1) {
    return (
      <PantallaCuenta titulo="Crear cuenta">
        <Pasos paso={1} />
        <form
          className="cuenta__formulario"
          onSubmit={(e) => {
            e.preventDefault()
            setPaso(2)
          }}
        >
          <fieldset className="rol">
            <legend className="solo-lectores">¿Cómo usarás Aruy?</legend>
            <h2 aria-hidden="true">¿Cómo usarás Aruy?</h2>
            <label className="rol__opcion">
              <input type="radio" name="rol" checked={!esPrestador} onChange={() => setRol('CONTRATANTE')} />
              <span className="rol__titulo">Quiero contratar servicios</span>
              <span className="rol__texto">
                Busca por categoría y zona, mira trabajos reales y escribe por WhatsApp.
              </span>
            </label>
            <label className="rol__opcion">
              <input type="radio" name="rol" checked={esPrestador} onChange={() => setRol('PRESTADOR')} />
              <span className="rol__titulo">Quiero ofrecer mis servicios</span>
              <span className="rol__texto">
                Publica lo que haces, sube fotos de tus trabajos y recibe clientes. Con la misma cuenta también puedes
                buscar y contratar.
              </span>
            </label>
          </fieldset>
          <Boton type="submit" grande ancho>
            Continuar
          </Boton>
        </form>
        <p className="cuenta__pie">
          ¿Ya tienes cuenta?
          <Link className="cuenta__enlace" to={`/ingresar${sufijo}`}>
            Iniciar sesión
          </Link>
        </p>
      </PantallaCuenta>
    )
  }

  return (
    <PantallaCuenta titulo={esPrestador ? 'Crea tu perfil' : 'Crea tu cuenta'}>
      <Pasos paso={2} />
      <div className="cuenta__rol">
        <span>{esPrestador ? 'Vas a ofrecer servicios' : 'Vas a contratar servicios'}</span>
        <button type="button" className="cuenta__enlace" onClick={() => setPaso(1)}>
          Cambiar
        </button>
      </div>

      <form className="cuenta__formulario" onSubmit={enviar} noValidate ref={formulario}>
        {fallo && <Aviso tipo="error">{fallo}</Aviso>}
        <Campo
          etiqueta="Nombre completo"
          name="nombre"
          autoComplete="name"
          autoCapitalize="words"
          placeholder="Ejemplo: Lucía Cevallos"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          error={errores.nombre}
        />
        <Campo
          etiqueta="Correo"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="nombre@correo.com"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          error={errores.correo}
        />
        <Campo
          etiqueta="Celular"
          type="tel"
          name="telefono"
          autoComplete="tel"
          inputMode="tel"
          placeholder="0998765432"
          ayuda="Las personas te contactan por este número en WhatsApp."
          value={celular}
          onChange={(e) => setCelular(e.target.value)}
          error={errores.celular}
        />
        <Campo
          etiqueta="Fecha de nacimiento"
          type="date"
          name="fecha_nacimiento"
          autoComplete="bday"
          max={fechaMaximaNacimiento()}
          ayuda="Aruy es solo para mayores de 18 años."
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          error={errores.fecha}
        />
        <Campo
          etiqueta="Contraseña"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          ayuda="Mínimo 8 caracteres, con letras y números."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errores.password}
        />
        <Campo
          etiqueta="Repite la contraseña"
          type="password"
          name="confirmar"
          autoComplete="new-password"
          value={confirmar}
          onChange={(e) => setConfirmar(e.target.value)}
          error={errores.confirmar}
        />

        {esPrestador && (
          <>
            <CampoSelect
              etiqueta="¿Qué servicio ofreces?"
              name="oficio"
              value={oficio}
              onChange={(e) => setOficio(e.target.value)}
              error={errores.oficio}
            >
              <option value="">Elige un servicio</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={ETIQUETA_CATEGORIA[c]}>
                  {ETIQUETA_CATEGORIA[c]}
                </option>
              ))}
            </CampoSelect>
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
          </>
        )}

        <div className={`acepto ${errores.acepta ? 'acepto--error' : ''}`}>
          <label className="acepto__fila">
            <input
              type="checkbox"
              name="acepta"
              checked={acepta}
              onChange={(e) => setAcepta(e.target.checked)}
              aria-invalid={errores.acepta ? true : undefined}
              aria-describedby={errores.acepta ? 'acepta-error' : undefined}
            />
            <span>
              Acepto las normas de la comunidad y el uso de mis datos según la{' '}
              <a href={URL_PRIVACIDAD} target="_blank" rel="noopener noreferrer">
                política de privacidad
              </a>
              .
            </span>
          </label>
          {errores.acepta && (
            <p className="campo__mensaje campo__mensaje--error" id="acepta-error" role="alert">
              {errores.acepta}
            </p>
          )}
        </div>

        <Boton type="submit" grande ancho cargando={cargando}>
          {cargando ? 'Creando tu cuenta…' : 'Crear cuenta'}
        </Boton>
      </form>

      <p className="cuenta__pie">
        ¿Ya tienes cuenta?
        <Link className="cuenta__enlace" to={`/ingresar${sufijo}`}>
          Iniciar sesión
        </Link>
      </p>
    </PantallaCuenta>
  )
}
