import { useRegisterSW } from 'virtual:pwa-register/react'
import { useState } from 'react'
import { aplicarActualizacion } from '../features/pwa/actualizar'
import { Boton } from './Boton'
import './AvisoActualizacion.css'

/** Banner «Hay una versión nueva» cuando el service worker tiene una actualización lista. */
export function AvisoActualizacion() {
  const {
    needRefresh: [hayNueva, setHayNueva],
    updateServiceWorker,
  } = useRegisterSW()

  const [actualizando, setActualizando] = useState(false)

  const actualizar = () => {
    setActualizando(true)
    void aplicarActualizacion({ actualizarPlugin: updateServiceWorker })
  }

  if (!hayNueva) return null
  return (
    <div className="actualizacion" role="status">
      <p>Hay una versión nueva</p>
      <div className="actualizacion__acciones">
        <Boton variante="texto" onClick={() => setHayNueva(false)} disabled={actualizando}>
          Después
        </Boton>
        <Boton onClick={actualizar} cargando={actualizando}>
          {actualizando ? 'Actualizando…' : 'Actualizar'}
        </Boton>
      </div>
    </div>
  )
}
