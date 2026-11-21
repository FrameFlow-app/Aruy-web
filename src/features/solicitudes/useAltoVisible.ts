import { useEffect, useState, type CSSProperties } from 'react'

function leer(): CSSProperties | undefined {
  const v = typeof window === 'undefined' ? undefined : window.visualViewport
  if (!v) return undefined
  return { top: v.offsetTop, height: v.height }
}

/**
 * Estilo (top y alto) del área realmente visible. En iOS el teclado no reduce el viewport de layout,
 * solo el visual: así la caja de texto fija se queda encima del teclado. Sin visualViewport devuelve
 * undefined y el CSS usa 100dvh.
 */
export function useAltoVisible(): CSSProperties | undefined {
  const [estilo, setEstilo] = useState<CSSProperties | undefined>(leer)

  useEffect(() => {
    const v = window.visualViewport
    if (!v) return
    const actualizar = () => {
      // Al enfocar un campo iOS desplaza la página: se devuelve arriba para que no se vea un hueco.
      if (v.offsetTop > 0) window.scrollTo(0, 0)
      setEstilo(leer())
    }
    v.addEventListener('resize', actualizar)
    v.addEventListener('scroll', actualizar)
    return () => {
      v.removeEventListener('resize', actualizar)
      v.removeEventListener('scroll', actualizar)
    }
  }, [])

  return estilo
}
