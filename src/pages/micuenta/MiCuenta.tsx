import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSesion } from '../../api/SesionContexto'
import { Avatar } from '../../components/Avatar'
import { Boton } from '../../components/Boton'
import { HojaInferior } from '../../components/HojaInferior'
import {
  IconoAjustes,
  IconoEditar,
  IconoFlecha,
  IconoPermisos,
  IconoSalir,
  IconoSolicitudes,
  IconoTelefono,
} from '../../features/micuenta/iconos'
import { IconoOfrecer, IconoPro } from '../../features/prestador/iconos'
import '../../features/micuenta/micuenta.css'
import { Pantalla } from '../Pantalla'

interface PropsFila {
  icono: ReactNode
  titulo: string
  detalle?: string
  a?: string
  onClick?: () => void
  peligro?: boolean
}

function Fila({ icono, titulo, detalle, a, onClick, peligro }: PropsFila) {
  const clase = `mc-fila ${peligro ? 'mc-fila--peligro' : ''}`.trim()
  const contenido = (
    <>
      <span className="mc-fila__icono">{icono}</span>
      <span className="mc-fila__texto">
        <span className="mc-fila__titulo">{titulo}</span>
        {detalle && <span className="mc-fila__detalle">{detalle}</span>}
      </span>
      {a && <IconoFlecha className="mc-fila__flecha" />}
    </>
  )
  return (
    <li>
      {a ? (
        <Link className={clase} to={a}>
          {contenido}
        </Link>
      ) : (
        <button type="button" className={clase} onClick={onClick}>
          {contenido}
        </button>
      )}
    </li>
  )
}

/** «Tu cuenta»: la sesión sale de RutaPrivada, que ya redirige a Ingresar si no hay. */
export function MiCuenta() {
  const { sesion, cerrar } = useSesion()
  const navegar = useNavigate()
  const [confirmando, setConfirmando] = useState(false)
  if (!sesion) return null
  const { usuario } = sesion
  const esPrestador = usuario.rol === 'PRESTADOR'

  const salir = () => {
    // Primero se navega y luego se limpia la sesión: así RutaPrivada no alcanza a llevar a Ingresar.
    navegar('/inicio', { replace: true })
    cerrar()
  }

  return (
    <Pantalla titulo="Tu cuenta" conBarra>
      <div className="mc-columna">
        <section className="mc-cabecera" aria-label="Tus datos">
          <div className="mc-cabecera__foto">
            <Avatar key={usuario.foto_perfil ?? 'sin-foto'} nombre={usuario.nombre} fotoUrl={usuario.foto_perfil} tamano={96} />
          </div>
          <h2>{usuario.nombre}</h2>
          <span className="mc-rol">{esPrestador ? 'Prestador' : 'Contratante'}</span>
        </section>

        <nav aria-label="Opciones de la cuenta">
          <ul className="mc-lista">
            <Fila icono={<IconoSolicitudes />} titulo="Mis solicitudes" a="/solicitudes" />
            {esPrestador ? (
              <Fila icono={<IconoPro />} titulo="Aruy Pro" detalle="Suscripción simulada" a="/pro" />
            ) : (
              <Fila
                icono={<IconoOfrecer />}
                titulo="Quiero ofrecer servicios"
                detalle="Con esta misma cuenta"
                a="/ofrecer"
              />
            )}
            <Fila icono={<IconoEditar />} titulo="Editar perfil" a="/cuenta/editar" />
            <Fila icono={<IconoAjustes />} titulo="Ajustes" a="/cuenta/ajustes" />
            <Fila icono={<IconoPermisos />} titulo="Permisos y notificaciones" a="/cuenta/permisos" />
            <Fila icono={<IconoTelefono />} titulo="Cómo instalar en iPhone" a="/instalar" />
            <Fila icono={<IconoSalir />} titulo="Cerrar sesión" onClick={() => setConfirmando(true)} />
          </ul>
        </nav>
      </div>

      <HojaInferior abierta={confirmando} titulo="¿Cerrar sesión?" onCerrar={() => setConfirmando(false)}>
        <p>Podrás volver a entrar cuando quieras con tu correo y tu contraseña.</p>
        <Boton ancho grande onClick={salir}>
          Cerrar sesión
        </Boton>
        <Boton ancho variante="texto" onClick={() => setConfirmando(false)}>
          Mejor no
        </Boton>
      </HojaInferior>
    </Pantalla>
  )
}
