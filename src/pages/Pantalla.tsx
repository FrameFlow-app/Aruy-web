import type { ReactNode } from 'react'
import { BarraInferior } from '../components/BarraInferior'
import { Encabezado } from '../components/Encabezado'
import { EstadoVacio } from '../components/EstadoVacio'
import './Pantalla.css'

interface Props {
  titulo: string
  atras?: boolean
  volverA?: string
  /** Muestra la barra inferior flotante (pantallas principales). */
  conBarra?: boolean
  children?: ReactNode
}

/** Contenedor de pantalla: respeta las zonas seguras de iPhone y deja sitio a la barra flotante. */
export function Pantalla({ titulo, atras, volverA, conBarra = false, children }: Props) {
  return (
    <>
      <main className={`pantalla ${conBarra ? 'pantalla--con-barra' : ''}`}>
        <Encabezado titulo={titulo} atras={atras} volverA={volverA} />
        {children}
      </main>
      {conBarra && <BarraInferior />}
    </>
  )
}

/** Pantalla provisional de la base: título y un aviso de que llega pronto. */
export function PantallaPendiente(props: Omit<Props, 'children'>) {
  return (
    <Pantalla {...props}>
      <EstadoVacio titulo="Esta pantalla llega pronto" texto="Estamos armando Aruy para iPhone paso a paso." />
    </Pantalla>
  )
}
