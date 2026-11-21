/** true si Aruy se abrió desde el ícono de la pantalla de inicio (sin barra del navegador). */
export function estaInstalada(): boolean {
  try {
    const nav = navigator as Navigator & { standalone?: boolean }
    if (nav.standalone === true) return true
    return typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches
  } catch {
    return false
  }
}
