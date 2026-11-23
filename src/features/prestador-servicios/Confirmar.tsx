import type { ReactNode } from 'react'
import { Boton } from '../../components/Boton'
import { HojaInferior } from '../../components/HojaInferior'
import './servicios.css'

interface Props {
  abierta: boolean
  titulo: string
  texto: ReactNode
  textoConfirmar: string
  ocupado?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

/** Confirmación de una acción que no se puede deshacer (borrar un servicio o una foto). */
export function Confirmar({ abierta, titulo, texto, textoConfirmar, ocupado = false, onConfirmar, onCancelar }: Props) {
  return (
    <HojaInferior abierta={abierta} titulo={titulo} onCerrar={onCancelar} cerrable={!ocupado}>
      <div className="sv-confirmar">
        <p>{texto}</p>
        <div className="sv-confirmar__acciones">
          <Boton variante="peligro" grande ancho cargando={ocupado} onClick={onConfirmar}>
            {textoConfirmar}
          </Boton>
          <Boton variante="texto" ancho disabled={ocupado} onClick={onCancelar}>
            Cancelar
          </Boton>
        </div>
      </div>
    </HojaInferior>
  )
}
