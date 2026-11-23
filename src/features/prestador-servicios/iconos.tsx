import type { ReactNode, SVGProps } from 'react'

// Iconos propios de servicios del prestador (mismo estilo: trazo redondeado de 2 px, 24x24).
type Props = Omit<SVGProps<SVGSVGElement>, 'children'> & { tamano?: number }

function Base({ tamano = 22, children, ...resto }: Props & { children: ReactNode }) {
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

export const IconoAgregar = (p: Props) => (
  <Base {...p}>
    <path d="M12 5v14M5 12h14" />
  </Base>
)

export const IconoPausa = (p: Props) => (
  <Base {...p}>
    <path d="M9 5v14M15 5v14" />
  </Base>
)

export const IconoReanudar = (p: Props) => (
  <Base {...p}>
    <path d="m8 5 11 7-11 7V5Z" />
  </Base>
)

export const IconoFotos = (p: Props) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4 17 5-4.5 3.5 3 3-2.5L20 17" />
  </Base>
)
