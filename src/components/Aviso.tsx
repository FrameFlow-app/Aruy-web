import type { ReactNode } from 'react'
import { IconoCheck, IconoError, IconoInfo } from './Iconos'
import './Aviso.css'

interface Props {
  tipo?: 'info' | 'error' | 'exito'
  children: ReactNode
  accion?: ReactNode
}

export function Aviso({ tipo = 'info', children, accion }: Props) {
  const Icono = tipo === 'error' ? IconoError : tipo === 'exito' ? IconoCheck : IconoInfo
  return (
    <div className={`aviso aviso--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
      <Icono />
      <div className="aviso__texto">{children}</div>
      {accion}
    </div>
  )
}
