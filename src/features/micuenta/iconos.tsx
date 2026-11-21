import type { ReactNode, SVGProps } from 'react'

// Iconos de Mi cuenta, con el mismo trazo que components/Iconos (2 px, redondeado, 24x24).
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

export const IconoSolicitudes = (p: Props) => (
  <Base {...p}>
    <path d="M4 13.5 6.6 5.8A2 2 0 0 1 8.5 4.5h7a2 2 0 0 1 1.9 1.3L20 13.5" />
    <path d="M4 13.5V18a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18v-4.5h-4.5a3.5 3.5 0 0 1-7 0Z" />
  </Base>
)

export const IconoEditar = (p: Props) => (
  <Base {...p}>
    <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    <path d="m14 8 3 3" />
  </Base>
)

export const IconoAjustes = (p: Props) => (
  <Base {...p}>
    <path d="M4 7h9" />
    <path d="M17 7h3" />
    <circle cx="15" cy="7" r="2" />
    <path d="M4 17h3" />
    <path d="M11 17h9" />
    <circle cx="9" cy="17" r="2" />
  </Base>
)

export const IconoPermisos = (p: Props) => (
  <Base {...p}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15Z" />
    <path d="M10 21h4" />
  </Base>
)

export const IconoTelefono = (p: Props) => (
  <Base {...p}>
    <rect x="7" y="3" width="10" height="18" rx="2.5" />
    <path d="M11 18h2" />
  </Base>
)

export const IconoSalir = (p: Props) => (
  <Base {...p}>
    <path d="M10 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H10" />
    <path d="M14 8l4 4-4 4" />
    <path d="M18 12H9" />
  </Base>
)

export const IconoCamara = (p: Props) => (
  <Base {...p}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.2-2h5.6L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5Z" />
    <circle cx="12" cy="13" r="3.3" />
  </Base>
)

export const IconoPapelera = (p: Props) => (
  <Base {...p}>
    <path d="M5 7h14" />
    <path d="M9.5 7V5h5v2" />
    <path d="M6.5 7 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
  </Base>
)

export const IconoFlecha = (p: Props) => (
  <Base {...p}>
    <path d="m9 6 6 6-6 6" />
  </Base>
)
