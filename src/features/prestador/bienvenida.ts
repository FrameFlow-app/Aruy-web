// Aviso de una sola vez tras activar el perfil de prestador. Va por sessionStorage porque, al cambiar
// el rol de la sesión, la guarda de /ofrecer redirige a /panel antes de que llegue un state de navegación.
const CLAVE = 'aruy.bienvenida-prestador'

export function marcarBienvenida(): void {
  try {
    sessionStorage.setItem(CLAVE, '1')
  } catch {
    // sin almacenamiento: simplemente no se muestra el aviso
  }
}

/** true una sola vez; después de leerlo se borra. */
export function consumirBienvenida(): boolean {
  try {
    const hay = sessionStorage.getItem(CLAVE) === '1'
    if (hay) sessionStorage.removeItem(CLAVE)
    return hay
  } catch {
    return false
  }
}
