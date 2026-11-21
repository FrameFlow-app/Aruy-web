import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconoCerrar } from './Iconos'
import './HojaInferior.css'

interface Props {
  abierta: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
  /** Si es false no se puede cerrar tocando el fondo ni con Escape (p. ej. mantenimiento). */
  cerrable?: boolean
}

const ENFOCABLES = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'

export function HojaInferior({ abierta, titulo, onCerrar, children, cerrable = true }: Props) {
  const idTitulo = useId()
  const hoja = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierta) return
    const previo = document.activeElement as HTMLElement | null
    const raiz = document.getElementById('root')
    raiz?.setAttribute('inert', '')
    const primero = hoja.current?.querySelector<HTMLElement>(ENFOCABLES)
    ;(primero ?? hoja.current)?.focus()
    const bloqueo = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && cerrable) {
        onCerrar()
        return
      }
      if (e.key !== 'Tab' || !hoja.current) return
      const lista = Array.from(hoja.current.querySelectorAll<HTMLElement>(ENFOCABLES))
      if (lista.length === 0) return
      const primeroL = lista[0]
      const ultimo = lista[lista.length - 1]
      if (e.shiftKey && document.activeElement === primeroL) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primeroL.focus()
      }
    }
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.removeEventListener('keydown', alTeclear)
      raiz?.removeAttribute('inert')
      document.body.style.overflow = bloqueo
      previo?.focus?.()
    }
  }, [abierta, cerrable, onCerrar])

  if (!abierta) return null
  return createPortal(
    <div className="hoja__fondo" onClick={cerrable ? onCerrar : undefined}>
      <div
        ref={hoja}
        className="hoja"
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hoja__asa" aria-hidden="true" />
        <div className="hoja__cabecera">
          <h2 id={idTitulo}>{titulo}</h2>
          {cerrable && (
            <button type="button" className="hoja__cerrar" onClick={onCerrar} aria-label="Cerrar">
              <IconoCerrar />
            </button>
          )}
        </div>
        <div className="hoja__contenido">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
