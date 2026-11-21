import type { ReactNode } from 'react'
import { Encabezado } from '../../components/Encabezado'
import './Cuenta.css'

interface PropsPantalla {
  titulo: string
  volverA?: string
  children: ReactNode
}

/** Pantalla de cuenta: columna de hasta 480 px centrada; el contenido hace scroll si el teclado ocupa espacio. */
export function PantallaCuenta({ titulo, volverA, children }: PropsPantalla) {
  return (
    <main className="cuenta">
      <div className="cuenta__columna">
        <Encabezado titulo={titulo} atras volverA={volverA} />
        {children}
      </div>
    </main>
  )
}

/** Barra de dos pasos del registro (como en Android). */
export function Pasos({ paso, total = 2 }: { paso: number; total?: number }) {
  return (
    <div className="pasos" role="img" aria-label={`Paso ${paso} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < paso ? 'pasos__tramo pasos__tramo--hecho' : 'pasos__tramo'} />
      ))}
    </div>
  )
}
