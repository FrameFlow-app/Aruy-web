import { useEffect, useRef, useState } from 'react'
import type { FotoServicio } from '../../api/tipos'
import { IconoCategoria, IconoCerrar } from '../../components/Iconos'
import { etiquetaCategoria } from './filtros'
import './Galeria.css'

function indiceVisible(el: HTMLElement): number {
  return el.clientWidth > 0 ? Math.round(el.scrollLeft / el.clientWidth) : 0
}

function descripcionFoto(f: FotoServicio, i: number, total: number, titulo: string): string {
  return f.descripcion?.trim() || `Foto ${i + 1} de ${total} de ${titulo}`
}

interface PropsGaleria {
  fotos: FotoServicio[]
  categoria: string
  titulo: string
}

/** Fotos deslizables (scroll-snap). Tocar una abre el visor a pantalla completa. */
export function Galeria({ fotos, categoria, titulo }: PropsGaleria) {
  const [actual, setActual] = useState(0)
  const [visor, setVisor] = useState<number | null>(null)
  const validas = fotos.filter((f) => f.url)

  if (validas.length === 0) {
    return (
      <div className="galeria galeria--vacia" role="img" aria-label={`Sin fotos. Categoría ${etiquetaCategoria(categoria)}`}>
        <IconoCategoria categoria={categoria} tamano={64} />
      </div>
    )
  }

  return (
    <>
      <div className="galeria">
        <div className="galeria__pista" onScroll={(e) => setActual(indiceVisible(e.currentTarget))}>
          {validas.map((f, i) => (
            <button
              key={f.id}
              type="button"
              className="galeria__foto"
              aria-label={`Ver a pantalla completa: ${descripcionFoto(f, i, validas.length, titulo)}`}
              onClick={() => setVisor(i)}
            >
              <img
                src={f.url ?? undefined}
                alt={descripcionFoto(f, i, validas.length, titulo)}
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
                draggable={false}
              />
            </button>
          ))}
        </div>
        {validas.length > 1 && (
          <>
            <div className="galeria__puntos" aria-hidden="true">
              {validas.map((f, i) => (
                <span key={f.id} className={i === actual ? 'galeria__punto galeria__punto--activo' : 'galeria__punto'} />
              ))}
            </div>
            <p className="galeria__contador" role="status">
              {actual + 1} de {validas.length}
            </p>
          </>
        )}
      </div>
      {visor !== null && <Visor fotos={validas} inicial={visor} titulo={titulo} onCerrar={() => setVisor(null)} />}
    </>
  )
}

interface PropsVisor {
  fotos: FotoServicio[]
  inicial: number
  titulo: string
  onCerrar: () => void
}

export function Visor({ fotos, inicial, titulo, onCerrar }: PropsVisor) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const pista = useRef<HTMLDivElement>(null)
  const [actual, setActual] = useState(inicial)

  useEffect(() => {
    const d = dialogo.current
    if (d && !d.open) d.showModal()
    const p = pista.current
    if (p) p.scrollLeft = inicial * p.clientWidth
  }, [inicial])

  return (
    <dialog
      ref={dialogo}
      className="visor"
      aria-label={`Fotos de ${titulo}`}
      onClose={onCerrar}
      onClick={(e) => {
        if (e.target === dialogo.current) dialogo.current?.close()
      }}
    >
      <div className="visor__pista" ref={pista} onScroll={(e) => setActual(indiceVisible(e.currentTarget))}>
        {fotos.map((f, i) => (
          <div key={f.id} className="visor__pagina">
            <img src={f.url ?? undefined} alt={descripcionFoto(f, i, fotos.length, titulo)} decoding="async" draggable={false} />
          </div>
        ))}
      </div>
      <button type="button" className="visor__cerrar" aria-label="Cerrar" onClick={() => dialogo.current?.close()}>
        <IconoCerrar />
      </button>
      <p className="visor__contador" role="status">
        {actual + 1} de {fotos.length}
      </p>
    </dialog>
  )
}
