import type { ReactNode, SVGProps } from 'react'

// Iconos propios del catálogo (mismo estilo que components/Iconos.tsx).
function Base({ tamano = 20, children, ...resto }: Omit<SVGProps<SVGSVGElement>, 'children'> & { tamano?: number; children: ReactNode }) {
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

export const IconoEstrella = ({ tamano }: Props) => (
  <Base tamano={tamano} fill="currentColor" strokeWidth={1.5}>
    <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8-4.2-4.1 5.8-.8L12 3.6Z" />
  </Base>
)

export const IconoVerificado = ({ tamano }: Props) => (
  <Base tamano={tamano}>
    <path d="M12 3 5 6v5.5c0 4.4 2.9 7.8 7 9.5 4.1-1.7 7-5.1 7-9.5V6l-7-3Z" />
    <path d="m8.8 12.2 2.3 2.3 4.2-4.6" />
  </Base>
)

export const IconoMarca = ({ tamano }: Props) => (
  <Base tamano={tamano}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.400-6.500 11-6.500 11Z" />
    <circle cx="12" cy="10" r="2.300" />
  </Base>
)

export const IconoFiltros = ({ tamano }: Props) => (
  <Base tamano={tamano}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </Base>
)

export const IconoEnviar = ({ tamano }: Props) => (
  <Base tamano={tamano}>
    <path d="M20.500 3.500 10 14" />
    <path d="M20.500 3.500 14 20.500l-4-6.500-6.500-4 17-6.500Z" />
  </Base>
)
