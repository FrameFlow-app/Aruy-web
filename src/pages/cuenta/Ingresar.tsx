import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import * as endpoints from '../../api/endpoints'
import { useSesion } from '../../api/SesionContexto'
import { Aviso } from '../../components/Aviso'
import { Boton } from '../../components/Boton'
import { Campo } from '../../components/Campo'
import { Logo } from '../../components/Logo'
import { mensajeDeError, useEnfocarPrimerError } from './ayudas'
import { PantallaCuenta } from './comun'
import { validarCorreo } from './validar'
import { rutaVolverSegura } from './volver'

export function Ingresar() {
  const { iniciar } = useSesion()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [parametros] = useSearchParams()
  const destino = rutaVolverSegura(parametros.get('volver'))
  // Al terminar de recuperar la contraseña se llega con el correo ya escrito.
  const correoPrevio = (ubicacion.state as { email?: string } | null)?.email ?? ''

  const [correo, setCorreo] = useState(correoPrevio)
  const [password, setPassword] = useState('')
  const [errores, setErrores] = useState<{ correo?: string; password?: string }>({})
  const [fallo, setFallo] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const { formulario, pedir } = useEnfocarPrimerError()

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (cargando) return
    const nuevos = {
      correo: validarCorreo(correo) ?? undefined,
      password: password ? undefined : 'Escribe tu contraseña.',
    }
    setErrores(nuevos)
    setFallo(null)
    if (nuevos.correo || nuevos.password) {
      pedir()
      return
    }
    setCargando(true)
    try {
      const r = await endpoints.login(correo.trim().toLowerCase(), password)
      iniciar(r)
      navegar(destino, { replace: true })
    } catch (err) {
      setFallo(mensajeDeError(err))
      setCargando(false)
    }
  }

  const sufijo = parametros.get('volver') ? `?volver=${encodeURIComponent(destino)}` : ''

  return (
    <PantallaCuenta titulo="Iniciar sesión">
      <div className="cuenta__intro">
        <div className="cuenta__marca">
          <Logo tamano={56} />
          <div className="cuenta__costura" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
        <h2>Bienvenido de vuelta</h2>
        <p className="texto-suave">Entra con tu correo y tu contraseña.</p>
      </div>

      <form className="cuenta__formulario" onSubmit={enviar} noValidate ref={formulario}>
        {fallo && <Aviso tipo="error">{fallo}</Aviso>}
        <Campo
          etiqueta="Correo"
          type="email"
          name="email"
          autoComplete="username"
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
          etiqueta="Contraseña"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="Tu contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errores.password}
        />
        <Link className="cuenta__enlace cuenta__enlace--derecha" to="/olvide" state={{ email: correo.trim() }}>
          ¿Olvidaste tu contraseña?
        </Link>
        <Boton type="submit" grande ancho cargando={cargando}>
          {cargando ? 'Entrando…' : 'Iniciar sesión'}
        </Boton>
      </form>

      <p className="cuenta__pie">
        ¿No tienes cuenta?
        <Link className="cuenta__enlace" to={`/registro${sufijo}`}>
          Crear cuenta
        </Link>
      </p>
    </PantallaCuenta>
  )
}
