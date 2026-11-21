import { useEffect, useRef, useState } from 'react'
import { IconoCategoria } from '../../components/Iconos'
import { cargarPortada, portadaEnCache } from './catalogo'
import './catalogo.css'

interface Props {
  servicioId: string
  categoria: string
  titulo: string
}

/**
 * Portada de un servicio. La foto se pide solo cuando la tarjeta se acerca a la pantalla
 * (el backend entrega las fotos por servicio). Sin foto, muestra el icono de la categoría.
 */
export function Portada({ servicioId, categoria, titulo }: Props) {
  const caja = useRef<HTMLDivElement>(null)
  const [url, setUrl] = useState<string | null>(() => portadaEnCache(servicioId) ?? null)
  const [cerca, setCerca] = useState(() => typeof IntersectionObserver === 'undefined')
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    const el = caja.current
    if (cerca || !el) return
    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setCerca(true)
          observador.disconnect()
        }
      },
      { rootMargin: '300px' },
    )
    observador.observe(el)
    return () => observador.disconnect()
  }, [cerca])

  useEffect(() => {
    if (!cerca || portadaEnCache(servicioId) !== undefined) return
    let vivo = true
    void cargarPortada(servicioId).then((u) => {
      if (vivo) setUrl(u)
    })
    return () => {
      vivo = false
    }
  }, [cerca, servicioId])

  return (
    <div className="portada" ref={caja}>
      <span className="portada__icono">
        <IconoCategoria categoria={categoria} tamano={34} />
      </span>
      {url && !fallo && (
        <img
          className="portada__img"
          src={url}
          alt={`Foto del servicio ${titulo}`}
          loading="lazy"
          decoding="async"
          onError={() => setFallo(true)}
        />
      )}
    </div>
  )
}
