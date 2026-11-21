import { Boton } from '../../components/Boton'
import { EstadoVacio } from '../../components/EstadoVacio'
import { Esqueleto } from '../../components/Cargando'
import { IconoActualizar, IconoError } from '../../components/Iconos'
import { MENSAJE_CONECTANDO } from '../../api/api'
import './catalogo.css'

interface PropsEsqueletos {
  lento: boolean
  texto?: string
  cantidad?: number
  alto?: number
}

/** Esqueletos de lista. Si el servidor tarda (se está despertando), lo dice. */
export function EsqueletosLista({ lento, texto = 'Cargando servicios…', cantidad = 3, alto = 112 }: PropsEsqueletos) {
  return (
    <div className="esqueletos" role="status" aria-live="polite">
      {Array.from({ length: cantidad }, (_, i) => (
        <Esqueleto key={i} alto={alto} />
      ))}
      <p className="texto-suave esqueletos__texto">{lento ? MENSAJE_CONECTANDO : texto}</p>
    </div>
  )
}

interface PropsError {
  mensaje: string
  estadoHttp: number | null
  onReintentar: () => void
  titulo?: string
}

export function ErrorReintentar({ mensaje, estadoHttp, onReintentar, titulo }: PropsError) {
  const sinRed = estadoHttp === 0
  return (
    <EstadoVacio
      icono={<IconoError tamano={32} />}
      titulo={titulo ?? (sinRed ? 'No pudimos conectar' : 'Algo salió mal')}
      texto={sinRed ? 'Revisa tu internet. Si el servidor estaba dormido, puede tardar un minuto en despertar.' : mensaje}
      accion={
        <Boton variante="secundario" icono={<IconoActualizar />} onClick={onReintentar}>
          Reintentar
        </Boton>
      }
    />
  )
}
