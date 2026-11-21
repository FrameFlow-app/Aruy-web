import './Logo.css'

interface Props {
  tamano?: number
  /** Con fondo añil redondeado (como el ícono de la app) o solo la marca. */
  conFondo?: boolean
}

/** La "A" con la costura de maíz: mismas proporciones que el ícono de Android. */
export function Logo({ tamano = 96, conFondo = true }: Props) {
  return (
    <svg
      className={`logo ${conFondo ? 'logo--fondo' : ''}`}
      width={tamano}
      height={tamano}
      viewBox="0 0 512 512"
      role="img"
      aria-label="Aruy"
      fill="none"
    >
      <path d="M130,398 L256,114 L382,398" stroke="#FFFFFF" strokeWidth="58" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M200,318h22M245,318h22M290,318h22" stroke="#F2B52E" strokeWidth="34" strokeLinecap="round" />
    </svg>
  )
}
