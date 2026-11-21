import { Link, useNavigate } from 'react-router-dom'
import { Boton } from '../components/Boton'
import { Logo } from '../components/Logo'
import './Bienvenida.css'

export function Bienvenida() {
  const navegar = useNavigate()
  return (
    <main className="bienvenida">
      <div className="bienvenida__marca">
        <Logo tamano={112} conFondo={false} />
        <div className="bienvenida__costura" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <h1>Ofrece tu trabajo. Encuentra tu cliente.</h1>
        <p>Plomeros, electricistas, pintores y más, cerca de ti.</p>
      </div>
      <div className="bienvenida__acciones">
        <Boton grande ancho className="bienvenida__principal" onClick={() => navegar('/inicio')}>
          Ver servicios
        </Boton>
        <Boton grande ancho variante="secundario" className="bienvenida__ingresar" onClick={() => navegar('/ingresar')}>
          Ya tengo cuenta
        </Boton>
        <Link className="bienvenida__enlace" to="/registro">
          Crear una cuenta
        </Link>
        <Link className="bienvenida__enlace bienvenida__enlace--suave" to="/instalar">
          Cómo instalar Aruy en tu iPhone
        </Link>
      </div>
    </main>
  )
}
