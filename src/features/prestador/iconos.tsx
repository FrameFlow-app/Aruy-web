import type { ReactNode, SVGProps } from 'react'

// Iconos del prestador, con el mismo trazo que components/Iconos (2 px, redondeado, 24x24).
type Props = Omit<SVGProps<SVGSVGElement>, 'children'>

function Base({ children, ...resto }: Props & { children: ReactNode }) {
  return (
    <svg
      width={24}
      height={24}
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

/** Panel: cuatro bloques. */
export const IconoPanel = (p: Props) => (
  <Base {...p}>
    <rect x="4" y="4" width="6.5" height="8" rx="1.8" />
    <rect x="13.5" y="4" width="6.5" height="5" rx="1.8" />
    <rect x="13.5" y="12" width="6.5" height="8" rx="1.8" />
    <rect x="4" y="15" width="6.5" height="5" rx="1.8" />
  </Base>
)

/** Servicios: maletín. */
export const IconoMaletin = (p: Props) => (
  <Base {...p}>
    <rect x="3.5" y="7.5" width="17" height="12" rx="2.2" />
    <path d="M9 7.5V6a1.8 1.8 0 0 1 1.8-1.8h2.4A1.8 1.8 0 0 1 15 6v1.5" />
    <path d="M3.5 13h17" />
  </Base>
)

/** Portafolio: foto con montaña. */
export const IconoPortafolio = (p: Props) => (
  <Base {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.4" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4 17 5-4.5 3.5 3 3-2.5L20 17" />
  </Base>
)

/** Explorar: brújula. */
export const IconoExplorar = (p: Props) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
  </Base>
)

/** Aruy Pro: estrella. */
export const IconoPro = (p: Props) => (
  <Base {...p}>
    <path d="m12 4 2.4 5 5.4.7-4 3.7 1 5.4L12 16.1 7.2 18.8l1-5.4-4-3.7 5.4-.7L12 4Z" />
  </Base>
)

/** Ofrecer servicios: herramienta con destello. */
export const IconoOfrecer = (p: Props) => (
  <Base {...p}>
    <path d="M14.5 6.2a4 4 0 0 0 4.9 4.9L10 20.5a2.1 2.1 0 0 1-3-3l9.4-9.4" />
    <path d="M6 4v3M4.5 5.5h3" />
  </Base>
)
