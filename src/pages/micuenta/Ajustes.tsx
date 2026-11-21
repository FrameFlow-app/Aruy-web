import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eliminarMiCuenta } from '../../api/endpoints'
import { useSesion } from '../../api/SesionContexto'
import { Aviso } from '../../components/Aviso'
import { Boton } from '../../components/Boton'
import { Campo } from '../../components/Campo'
import { HojaInferior } from '../../components/HojaInferior'
import { IconoPapelera } from '../../features/micuenta/iconos'
import '../../features/micuenta/micuenta.css'
import { guardarTema, leerTema, TEMAS, type PreferenciaTema } from '../../features/micuenta/tema'
import { mensajeDeError } from '../cuenta/ayudas'
import { Pantalla } from '../Pantalla'
import paquete from '../../../package.json'

export const URL_PRIVACIDAD = 'https://frameflow-app.github.io/Aruy-app/privacidad.html'
export const PALABRA_BAJA = 'ELIMINAR'

const ETIQUETA_TEMA: Record<PreferenciaTema, string> = {
  sistema: 'Sistema',
  claro: 'Claro',
  oscuro: 'Oscuro',
}

export function Ajustes() {
  const { cerrar } = useSesion()
  const navegar = useNavigate()
  const [tema, setTema] = useState<PreferenciaTema>(() => leerTema())
  const [bajaAbierta, setBajaAbierta] = useState(false)
  const [palabra, setPalabra] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [fallo, setFallo] = useState<string | null>(null)

  const elegirTema = (t: PreferenciaTema) => {
    setTema(t)
    guardarTema(t)
  }

  const cerrarBaja = () => {
    if (eliminando) return
    setBajaAbierta(false)
    setPalabra('')
    setFallo(null)
  }

  const confirmada = palabra.trim().toUpperCase() === PALABRA_BAJA

  const eliminar = async () => {
    if (!confirmada || eliminando) return
    setEliminando(true)
    setFallo(null)
    try {
      await eliminarMiCuenta()
      // Primero se navega y luego se limpia la sesión, para que RutaPrivada no lleve a Ingresar.
      navegar('/', { replace: true, state: { cuentaEliminada: true } })
      cerrar()
    } catch (e) {
      setFallo(mensajeDeError(e))
      setEliminando(false)
    }
  }

  return (
    <Pantalla titulo="Ajustes" atras volverA="/cuenta">
      <div className="mc-columna">
        <fieldset className="mc-opciones-grupo">
          <legend className="mc-leyenda">Tema</legend>
          <div className="mc-opciones">
            {TEMAS.map((t) => (
              <label key={t} className="mc-opcion">
                <input type="radio" name="tema" checked={tema === t} onChange={() => elegirTema(t)} />
                {ETIQUETA_TEMA[t]}
              </label>
            ))}
          </div>
          <p className="texto-suave mc-nota">
            «Sistema» sigue el modo claro u oscuro de tu iPhone. Se guarda solo en este dispositivo.
          </p>
        </fieldset>

        <section className="mc-seccion" aria-label="Acerca de Aruy">
          <h2>Acerca de</h2>
          <dl className="mc-datos">
            <div className="mc-dato">
              <dt>Versión de la web</dt>
              <dd>{paquete.version}</dd>
            </div>
          </dl>
          <a className="mc-enlace" href={URL_PRIVACIDAD} target="_blank" rel="noopener noreferrer">
            Política de privacidad (se abre en otra pestaña)
          </a>
        </section>

        <section className="mc-seccion" aria-label="Zona peligrosa">
          <h2>Zona peligrosa</h2>
          <p className="texto-suave">Eliminar tu cuenta borra tus datos para siempre. No se puede deshacer.</p>
          <Boton ancho variante="secundario" icono={<IconoPapelera />} onClick={() => setBajaAbierta(true)}>
            Eliminar mi cuenta
          </Boton>
        </section>
      </div>

      <HojaInferior abierta={bajaAbierta} titulo="¿Eliminar tu cuenta?" onCerrar={cerrarBaja} cerrable={!eliminando}>
        <Aviso tipo="error">Esto elimina tu cuenta para siempre. No se puede deshacer.</Aviso>
        <div>
          <p>Se borra:</p>
          <ul className="mc-lista-puntos">
            <li>Tu cuenta: nombre, celular, correo y contraseña.</li>
            <li>Si eres prestador: tu perfil, tus servicios y sus fotos.</li>
            <li>Las opiniones que hiciste y las que recibiste.</li>
          </ul>
        </div>
        {fallo && <Aviso tipo="error">{fallo}</Aviso>}
        <Campo
          etiqueta={`Para confirmar, escribe ${PALABRA_BAJA}`}
          autoCapitalize="characters"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          value={palabra}
          onChange={(e) => setPalabra(e.target.value)}
        />
        <Boton ancho grande variante="peligro" disabled={!confirmada} cargando={eliminando} onClick={eliminar}>
          {eliminando ? 'Eliminando…' : 'Eliminar mi cuenta'}
        </Boton>
        <Boton ancho variante="texto" onClick={cerrarBaja} disabled={eliminando}>
          Mejor no
        </Boton>
      </HojaInferior>
    </Pantalla>
  )
}
