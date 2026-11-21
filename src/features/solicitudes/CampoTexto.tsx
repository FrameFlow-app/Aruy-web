import { useId, type TextareaHTMLAttributes } from 'react'
import './solicitudes.css'

interface Props extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'onChange' | 'value' | 'maxLength'> {
  etiqueta: string
  valor: string
  onValor: (v: string) => void
  max: number
  ayuda?: string
}

/** Área de texto con etiqueta y contador (n/max). */
export function CampoTexto({ etiqueta, valor, onValor, max, ayuda, rows = 4, className = '', ...resto }: Props) {
  const id = useId()
  const cerca = valor.length >= max * 0.9
  return (
    <div className={`campo-texto ${className}`.trim()}>
      <label className="campo__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <textarea
        id={id}
        className="campo-texto__area"
        rows={rows}
        value={valor}
        maxLength={max}
        aria-describedby={`${id}-contador`}
        onChange={(e) => onValor(e.target.value)}
        {...resto}
      />
      <div className="campo-texto__pie">
        <span className="campo__mensaje">{ayuda}</span>
        <span id={`${id}-contador`} className={`campo-texto__contador ${cerca ? 'campo-texto__contador--alto' : ''}`}>
          {valor.length}/{max}
        </span>
      </div>
    </div>
  )
}
