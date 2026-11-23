export interface OpcionesActualizacion {
  /** `updateServiceWorker` de vite-plugin-pwa. */
  actualizarPlugin: (recargar?: boolean) => Promise<void> | void
  /** Recarga la página (por defecto `location.reload`). */
  recargar?: () => void
  /** Máximo que se espera al plugin antes de usar el respaldo. */
  esperaPluginMs?: number
  /** Si nada ocurre en este tiempo, se recarga de todos modos. */
  esperaFinalMs?: number
}

/**
 * Activa el service worker en espera y recarga la página una sola vez.
 * El plugin a veces deja la promesa colgada, así que se le da un tiempo
 * acotado, se envía SKIP_WAITING a mano y hay una recarga de último recurso.
 */
export async function aplicarActualizacion({
  actualizarPlugin,
  recargar = () => window.location.reload(),
  esperaPluginMs = 1000,
  esperaFinalMs = 4000,
}: OpcionesActualizacion): Promise<void> {
  let recargada = false
  const recargarUnaVez = () => {
    if (recargada) return
    recargada = true
    recargar()
  }

  const contenedor = typeof navigator === 'undefined' ? undefined : navigator.serviceWorker
  if (!contenedor) {
    recargarUnaVez()
    return
  }

  contenedor.addEventListener('controllerchange', recargarUnaVez, { once: true })

  let registro: ServiceWorkerRegistration | undefined
  try {
    registro = await contenedor.getRegistration()
  } catch {
    registro = undefined
  }

  // Sin SW en espera: ya se activó (p. ej. en otra pestaña).
  if (!registro?.waiting) {
    recargarUnaVez()
    return
  }

  setTimeout(recargarUnaVez, esperaFinalMs)

  try {
    await Promise.race([
      Promise.resolve(actualizarPlugin(true)),
      new Promise<void>((resolver) => setTimeout(resolver, esperaPluginMs)),
    ])
  } catch {
    // el respaldo de abajo se encarga
  }

  const esperando = (await contenedor.getRegistration().catch(() => registro))?.waiting
  esperando?.postMessage({ type: 'SKIP_WAITING' })
}
