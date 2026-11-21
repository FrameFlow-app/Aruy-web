import { useId, useState, type InputHTMLAttributes } from 'react'
import { IconoOjo, IconoOjoCerrado } from './Iconos'
import './Campo.css'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  etiqueta: string
  error?: string
  ayuda?: string
}

export function Campo({ etiqueta, error, ayuda, type = 'text', className = '', ...resto }: Props) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  const esClave = type === 'password'
  const descripcion = [error && `${id}-error`, ayuda && `${id}-ayuda`].filter(Boolean).join(' ') || undefined

  return (
    <div className={`campo ${error ? 'campo--error' : ''} ${className}`.trim()}>
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <div className="campo__caja">
        <input
          id={id}
          className="campo__input"
          type={esClave && visible ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={descripcion}
          {...resto}
        />
        {esClave && (
          <button
            type="button"
            className="campo__ojo"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
          >
            {visible ? <IconoOjoCerrado /> : <IconoOjo />}
          </button>
        )}
      </div>
      {error && (
        <p className="campo__mensaje campo__mensaje--error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
      {ayuda && !error && (
        <p className="campo__mensaje" id={`${id}-ayuda`}>
          {ayuda}
        </p>
      )}
    </div>
  )
}
