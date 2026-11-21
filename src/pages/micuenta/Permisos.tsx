import { Link } from 'react-router-dom'
import { Aviso } from '../../components/Aviso'
import { Tarjeta } from '../../components/Tarjeta'
import { estaInstalada } from '../../features/micuenta/instalacion'
import '../../features/micuenta/micuenta.css'
import { Pantalla } from '../Pantalla'

/** Explica con honestidad qué hace (y qué no hace todavía) la versión web con permisos y avisos. */
export function Permisos() {
  const instalada = estaInstalada()
  return (
    <Pantalla titulo="Permisos y notificaciones" atras volverA="/cuenta">
      <div className="mc-columna">
        <Tarjeta>
          <div className="mc-seccion">
            <h2>Notificaciones</h2>
            <p>
              La web de Aruy todavía no envía notificaciones push: no te va a sonar el teléfono cuando llegue algo nuevo.
            </p>
            <p>
              Con Aruy abierta, la campana del inicio se actualiza sola cada 30 segundos. Si cierras la app, revisa la
              campana cuando vuelvas a entrar.
            </p>
          </div>
        </Tarjeta>

        <Tarjeta>
          <div className="mc-seccion">
            <h2>Cámara y fotos</h2>
            <p>
              Aruy no tiene acceso permanente a tu cámara ni a tu galería. Solo se abren cuando tocas tu foto en «Editar
              perfil» y eliges o tomas una imagen.
            </p>
          </div>
        </Tarjeta>

        <section className="mc-seccion" aria-label="Instalación">
          <h2>Instalación</h2>
          {instalada ? (
            <Aviso tipo="exito">Aruy está instalada: la abriste desde la pantalla de inicio.</Aviso>
          ) : (
            <Aviso tipo="info">Aruy se está abriendo desde el navegador, no desde la pantalla de inicio.</Aviso>
          )}
          {!instalada && (
            <Link className="mc-enlace" to="/instalar">
              Cómo instalar Aruy en tu iPhone
            </Link>
          )}
        </section>
      </div>
    </Pantalla>
  )
}
