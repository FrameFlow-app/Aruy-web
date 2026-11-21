// Preferencia de tema (Sistema, Claro u Oscuro). Se guarda en este dispositivo y se aplica con
// data-theme en <html>; sin atributo, manda prefers-color-scheme.

export type PreferenciaTema = 'sistema' | 'claro' | 'oscuro'

export const CLAVE_TEMA = 'aruy.tema'
export const TEMAS: readonly PreferenciaTema[] = ['sistema', 'claro', 'oscuro']

export function esTema(valor: unknown): valor is PreferenciaTema {
  return typeof valor === 'string' && (TEMAS as readonly string[]).includes(valor)
}

export function leerTema(): PreferenciaTema {
  try {
    const v = localStorage.getItem(CLAVE_TEMA)
    return esTema(v) ? v : 'sistema'
  } catch {
    return 'sistema'
  }
}

/** Valor del atributo data-theme, o null para dejar que decida el sistema. */
export function atributoTema(tema: PreferenciaTema): 'light' | 'dark' | null {
  return tema === 'claro' ? 'light' : tema === 'oscuro' ? 'dark' : null
}

export function aplicarTema(tema: PreferenciaTema, raiz: HTMLElement = document.documentElement): void {
  const atributo = atributoTema(tema)
  if (atributo) raiz.setAttribute('data-theme', atributo)
  else raiz.removeAttribute('data-theme')
}

export function guardarTema(tema: PreferenciaTema): void {
  try {
    if (tema === 'sistema') localStorage.removeItem(CLAVE_TEMA)
    else localStorage.setItem(CLAVE_TEMA, tema)
  } catch {
    // Sin almacenamiento: el tema se aplica, pero solo hasta cerrar la app.
  }
  aplicarTema(tema)
}

/** Se llama al arrancar, antes de pintar, para evitar un destello del tema equivocado. */
export function aplicarTemaGuardado(): void {
  aplicarTema(leerTema())
}
