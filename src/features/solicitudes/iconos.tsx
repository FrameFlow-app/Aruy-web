import type { ReactNode, SVGProps } from 'react'

// Iconos de solicitudes y chat (mismo trazo que components/Iconos.tsx).
function Base({ tamano = 24, children, ...resto }: Omit<SVGProps<SVGSVGElement>, 'children'> & { tamano?: number; children: ReactNode }) {
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

interface Props {
  tamano?: number
}

export const IconoCampana = ({ tamano }: Props) => (
  <Base tamano={tamano}>
    <path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5l1.5-2Z" />
    <path d="M10 21h4" />
  </Base>
)

export const IconoWhatsapp = ({ tamano }: Props) => (
  <Base tamano={tamano}>
    <path d="M4 20l1.2-4.2A8 8 0 1 1 8.300 18.900L4 20Z" />
    <path d="M9.200 8.800c.2 2.600 2.400 5 5.200 5.800l1.100-1.300-1.800-.9-.8.700c-.9-.4-1.700-1.200-2.100-2.100l.7-.8-.9-1.800-1.400 1.400Z" />
  </Base>
)

export const IconoSolicitudes = ({ tamano }: Props) => (
  <Base tamano={tamano}>
    <path d="M4 5.500h16v10H9.500L5 19.500v-4H4v-10Z" />
    <path d="M8 9.500h8M8 12.500h5" />
  </Base>
)
