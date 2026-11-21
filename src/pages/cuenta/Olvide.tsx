import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as endpoints from '../../api/endpoints'
import { Aviso } from '../../components/Aviso'
import { Boton } from '../../components/Boton'
import { Campo } from '../../components/Campo'
import { mensajeDeError, useEnfocarPrimerError } from './ayudas'
import { PantallaCuenta } from './comun'
import { LARGO_CODIGO, validarCodigo, validarConfirmacion, validarCorreo, validarPassword } from './validar'

const ESPERA_REENVIO_S = 60

type Paso = 'correo' | 'codigo' | 'listo'

export function Olvide() {
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const correoPrevio = (ubicacion.state as { email?: string } | null)?.email ?? ''

  const [paso, setPaso] = useState<Paso>('correo')
  const [correo, setCorreo] = useState(correoPrevio)
  const [codigo, setCodigo] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [errores, setErrores] = useState<Partial<Record<'correo' | 'codigo' | 'password' | 'confirmar', string>>>({})
  const [fallo, setFallo] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [espera, setEspera] = useState(0)
  const { formulario, pedir } = useEnfocarPrimerError()

  // Cuenta regresiva para poder reenviar el codigo (el backend limita a 3 por hora).
  useEffect(() => {
    if (espera <= 0) return
    const t = setTimeout(() => setEspera((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [espera])

  const correoLimpio = correo.trim().toLowerCase()

  const pedirCodigo = async (reenvio = false) => {
    setFallo(null)
    setInfo(null)
    setCargando(true)
    try {
      await endpoints.olvide(correoLimpio)
      setInfo('Si el correo está registrado, te enviamos un código.')
      setEspera(ESPERA_REENVIO_S)
      if (!reenvio) setPaso('codigo')
    } catch (err) {
      setFallo(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }

  const enviarCorreo = (e: FormEvent) => {
    e.preventDefault()
    if (cargando) return
    const error = validarCorreo(correo) ?? undefined
    setErrores({ correo: error })
    if (error) {
      pedir()
      return
    }
    void pedirCodigo()
  }

  const enviarCodigo = async (e: FormEvent) => {
    e.preventDefault()
    if (cargando) return
    const nuevos = {
      codigo: validarCodigo(codigo) ?? undefined,
      password: validarPassword(password) ?? undefined,
      confirmar: validarConfirmacion(password, confirmar) ?? undefined,
    }
    setErrores(nuevos)
    setFallo(null)
    if (Object.values(nuevos).some(Boolean)) {
      pedir()
      return
    }
    setCargando(true)
    try {
      await endpoints.restablecer(correoLimpio, codigo.trim(), password)
      setPaso('listo')
    } catch (err) {
      setFallo(mensajeDeError(err))
    } finally {
      setCargando(false)
    }
  }

  const usarOtroCorreo = () => {
    setPaso('correo')
    setCodigo('')
    setPassword('')
    setConfirmar('')
    setErrores({})
    setFallo(null)
    setInfo(null)
  }

  if (paso === 'listo') {
    return (
      <PantallaCuenta titulo="Recuperar contraseña">
        <div className="cuenta__ok">
          <Aviso tipo="exito">Tu contraseña se cambió. Ya puedes entrar con la nueva.</Aviso>
          <Boton grande ancho onClick={() => navegar('/ingresar', { replace: true, state: { email: correoLimpio } })}>
            Ir a iniciar sesión
          </Boton>
        </div>
      </PantallaCuenta>
    )
  }

  if (paso === 'correo') {
    return (
      <PantallaCuenta titulo="Recuperar contraseña">
        <div className="cuenta__intro">
          <h2>¿Olvidaste tu contraseña?</h2>
          <p className="texto-suave">
            Escribe el correo de tu cuenta y te enviamos un código de {LARGO_CODIGO} dígitos.
          </p>
        </div>
        <form className="cuenta__formulario" onSubmit={enviarCorreo} noValidate ref={formulario}>
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
          <Boton type="submit" grande ancho cargando={cargando}>
            {cargando ? 'Enviando…' : 'Enviar código'}
          </Boton>
        </form>
      </PantallaCuenta>
    )
  }

  return (
    <PantallaCuenta titulo="Recuperar contraseña">
      <div className="cuenta__intro">
        <h2>Revisa tu correo</h2>
        <p className="texto-suave">
          Escribe el código y elige tu contraseña nueva. Puede tardar un minuto en llegar; revisa también el spam.
        </p>
      </div>
      <form className="cuenta__formulario" onSubmit={enviarCodigo} noValidate ref={formulario}>
        {info && !fallo && <Aviso tipo="info">{info}</Aviso>}
        {fallo && <Aviso tipo="error">{fallo}</Aviso>}
        <Campo
          etiqueta={`Código de ${LARGO_CODIGO} dígitos`}
          name="codigo"
          autoComplete="one-time-code"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={LARGO_CODIGO}
          placeholder="000000"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, LARGO_CODIGO))}
          error={errores.codigo}
        />
        <Campo
          etiqueta="Contraseña nueva"
          type="password"
          name="password"
          autoComplete="new-password"
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
        <Boton type="submit" grande ancho cargando={cargando}>
          {cargando ? 'Guardando…' : 'Cambiar contraseña'}
        </Boton>
      </form>
      <div className="cuenta__pie">
        <button
          type="button"
          className="cuenta__enlace"
          disabled={espera > 0 || cargando}
          onClick={() => void pedirCodigo(true)}
        >
          {espera > 0 ? `Reenviar código en ${espera} s` : 'Reenviar código'}
        </button>
        <button type="button" className="cuenta__enlace" onClick={usarOtroCorreo}>
          Usar otro correo
        </button>
      </div>
    </PantallaCuenta>
  )
}
