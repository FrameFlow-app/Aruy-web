import type { ReactNode, SVGProps } from 'react'
import type { Categoria } from '../api/tipos'

// Iconos propios en SVG (trazo redondeado de 2 px, 24x24). Sin librerias.
interface PropsIcono extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  tamano?: number
}

function Base({ tamano = 24, children, ...resto }: PropsIcono & { children: ReactNode }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...resto}
    >
      {children}
    </svg>
  )
}

export const IconoInicio = (p: PropsIcono) => (
  <Base {...p}>
    <path d="M4 11 12 4l8 7" />
    <path d="M6 10v9h12v-9" />
    <path d="M10 19v-5h4v5" />
  </Base>
)

export const IconoBuscar = (p: PropsIcono) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Base>
)

export const IconoCuenta = (p: PropsIcono) => (
  <Base {...p}>
    <circle cx="12" cy="8.5" r="3.7" />
    <path d="M4.5 20c.9-3.6 3.8-5.5 7.5-5.5s6.6 1.9 7.5 5.5" />
  </Base>
)

export const IconoAtras = (p: PropsIcono) => (
  <Base {...p}>
    <path d="M19 12H5" />
    <path d="m11 6-6 6 6 6" />
  </Base>
)

export const IconoOjo = (p: PropsIcono) => (
  <Base {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Base>
)

export const IconoOjoCerrado = (p: PropsIcono) => (
  <Base {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.3 5.7A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8" />
    <path d="M6.5 7.3A16 16 0 0 0 2.5 12S6 18.5 12 18.5c1.5 0 2.8-.4 4-.9" />
  </Base>
)

export const IconoCerrar = (p: PropsIcono) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
)

export const IconoCheck = (p: PropsIcono) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12.3 2.8 2.8L16 9.5" />
  </Base>
)

export const IconoError = (p: PropsIcono) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.4v.1" />
  </Base>
)

export const IconoInfo = (p: PropsIcono) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.6v.1" />
  </Base>
)

export const IconoActualizar = (p: PropsIcono) => (
  <Base {...p}>
    <path d="M20 12a8 8 0 1 1-2.6-5.9" />
    <path d="M20 4v5h-5" />
  </Base>
)

export const IconoCompartir = (p: PropsIcono) => (
  <Base {...p}>
    <path d="M12 15V3.5" />
    <path d="m7.5 8 4.5-4.5L16.5 8" />
    <path d="M6 11.5H5v8.5h14v-8.5h-1" />
  </Base>
)

export const IconoMas = (p: PropsIcono) => (
  <Base {...p}>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="M12 8.5v7M8.5 12h7" />
  </Base>
)

export const IconoMantenimiento = (p: PropsIcono) => (
  <Base {...p}>
    <path d="M14.5 6.5a4 4 0 0 0 4.9 4.9l-8.8 8.8a2.1 2.1 0 0 1-3-3l8.8-8.8a4 4 0 0 0-1.9-1.9Z" />
  </Base>
)

// Categorias (mismas ideas que los iconos de Material usados en Android)
export const IconoPlomeria = (p: PropsIcono) => (
  <Base {...p}>
    <path d="M5 7h9a3 3 0 0 1 3 3v1" />
    <path d="M5 4v6M3 4h4" />
    <path d="M17 11v3M15 14h4" />
    <path d="M17 18.5c-1.1-1.4-1.6-2.1-1.6-2.8a1.6 1.6 0 0 1 3.2 0c0 .7-.5 1.4-1.6 2.8Z" />
  </Base>
)

export const IconoElectricidad = (p: PropsIcono) => (
  <Base {...p}>
    <path d="M13 3 5.5 13.5H11L10 21l8-11h-5.5L13 3Z" />
  </Base>
)

export const IconoAlbanileria = (p: PropsIcono) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="14" rx="1.5" />
    <path d="M3 10h18M3 14.5h18M9 5v5M15 10v4.5M9 14.5V19" />
  </Base>
)

export const IconoPintura = (p: PropsIcono) => (
  <Base {...p}>
    <rect x="4" y="3.5" width="13" height="5.5" rx="1.8" />
    <path d="M17 6h2.5v5H12v3" />
    <rect x="10" y="14" width="4" height="7" rx="1.5" />
  </Base>
)

export const IconoCarpinteria = (p: PropsIcono) => (
  <Base {...p}>
    <path d="M4 18 15 7" />
    <path d="m13 4 2-1.5 5 5L18.5 9.5 13 4Z" />
    <path d="M3.5 20.5 6 18" />
  </Base>
)

export const IconoBelleza = (p: PropsIcono) => (
  <Base {...p}>
    <path d="M12 21c-4.5-1.5-7-5-7-9 3.500 0 6 1.700 7 4.500C13 13.700 15.500 12 19 12c0 4-2.500 7.500-7 9Z" />
    <path d="M12 16.500C10.500 13 10.500 9 12 4c1.500 5 1.500 9 0 12.500Z" />
  </Base>
)

export const IconoOtros = (p: PropsIcono) => (
  <Base {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <circle cx="17" cy="17" r="3.5" />
  </Base>
)

const ICONOS_CATEGORIA: Record<Categoria, (p: PropsIcono) => ReactNode> = {
  PLOMERIA: IconoPlomeria,
  ELECTRICIDAD: IconoElectricidad,
  ALBANILERIA: IconoAlbanileria,
  PINTURA: IconoPintura,
  CARPINTERIA: IconoCarpinteria,
  BELLEZA: IconoBelleza,
  OTROS: IconoOtros,
}

export function IconoCategoria({ categoria, ...p }: PropsIcono & { categoria: Categoria | string }) {
  const Componente = ICONOS_CATEGORIA[categoria as Categoria] ?? IconoOtros
  return <>{Componente(p)}</>
}
