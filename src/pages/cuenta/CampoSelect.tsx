import { useId, type SelectHTMLAttributes } from 'react'
import '../../components/Campo.css'

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  etiqueta: string
  error?: string
}

/** Select con el mismo aspecto y accesibilidad que Campo. */
export function CampoSelect({ etiqueta, error, className = '', children, ...resto }: Props) {
  const id = useId()
  return (
    <div className={`campo ${error ? 'campo--error' : ''} ${className}`.trim()}>
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <div className="campo__caja">
        <select
          id={id}
          className="campo__input campo__select"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...resto}
        >
          {children}
        </select>
      </div>
      {error && (
        <p className="campo__mensaje campo__mensaje--error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
