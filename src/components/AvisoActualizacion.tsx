import { useRegisterSW } from 'virtual:pwa-register/react'
import { Boton } from './Boton'
import './AvisoActualizacion.css'

/** Banner «Hay una versión nueva» cuando el service worker tiene una actualización lista. */
export function AvisoActualizacion() {
  const {
    needRefresh: [hayNueva, setHayNueva],
    updateServiceWorker,
  } = useRegisterSW()

  if (!hayNueva) return null
  return (
    <div className="actualizacion" role="status">
      <p>Hay una versión nueva</p>
      <div className="actualizacion__acciones">
        <Boton variante="texto" onClick={() => setHayNueva(false)}>
          Después
        </Boton>
        <Boton onClick={() => void updateServiceWorker(true)}>Actualizar</Boton>
      </div>
    </div>
  )
}
