import { useState } from 'react'
import { useCarga } from '../../features/catalogo/useCarga'
import { Aviso } from '../../components/Aviso'
import { Boton } from '../../components/Boton'
import { HojaInferior } from '../../components/HojaInferior'
import { Tarjeta } from '../../components/Tarjeta'
import { ErrorReintentar, EsqueletosLista } from '../../features/catalogo/Cargas'
import { Pastilla } from '../../features/catalogo/Insignias'
import {
  cancelarSuscripcion,
  miSuscripcion,
  suscribirse,
  type Suscripcion,
  type TipoPlan,
} from '../../features/prestador/api'
import {
  etiquetaEstado,
  fechaLarga,
  PLANES,
  planDe,
  puedeCancelar,
  puedeContratar,
} from '../../features/prestador/pro'
import { mensajeDeError } from '../cuenta/ayudas'
import { Pantalla } from '../Pantalla'
import '../cuenta/Cuenta.css'
import '../../features/micuenta/micuenta.css'
import '../../features/prestador/prestador.css'

function Actual({ s, procesando, onCancelar }: { s: Suscripcion; procesando: boolean; onCancelar: () => void }) {
  const plan = planDe(s.tipo_plan)
  const inicio = fechaLarga(s.fecha_inicio)
  const fin = fechaLarga(s.fecha_fin)
  const tipoPastilla = s.estado === 'ACTIVA' ? 'ok' : s.estado === 'PENDIENTE' ? 'aviso' : 'neutra'
  return (
    <Tarjeta className="pro-actual" aria-labelledby="pro-actual">
      <div className="pro-actual__cabeza">
        <h2 id="pro-actual">{plan?.titulo ?? 'Aruy Pro'}</h2>
        <Pastilla tipo={tipoPastilla}>{etiquetaEstado(s.estado)}</Pastilla>
      </div>
      {inicio && <p>Desde el {inicio}</p>}
      {fin && <p>{s.estado === 'ACTIVA' || s.estado === 'PENDIENTE' ? `Termina el ${fin}` : `Terminó el ${fin}`}</p>}
      {puedeCancelar(s) && (
        <Boton variante="secundario" ancho onClick={onCancelar} disabled={procesando}>
          Cancelar suscripción
        </Boton>
      )}
    </Tarjeta>
  )
}

export function AruyPro() {
  const carga = useCarga('suscripcion', miSuscripcion)
  // Tras suscribirse o cancelar manda la respuesta del servidor, no la carga inicial.
  const [local, setLocal] = useState<{ valor: Suscripcion } | null>(null)
  const [plan, setPlan] = useState<TipoPlan>('ARUY_PRO_SEMANAL')
  const [renovar, setRenovar] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [exito, setExito] = useState<string | null>(null)
  const [fallo, setFallo] = useState<string | null>(null)

  const actual = local ? local.valor : (carga.datos ?? null)

  const activar = async () => {
    setProcesando(true)
    setFallo(null)
    setExito(null)
    try {
      const s = await suscribirse(plan, renovar)
      setLocal({ valor: s })
      setExito('Listo: tu suscripción simulada está activa.')
    } catch (e) {
      setFallo(mensajeDeError(e))
    } finally {
      setProcesando(false)
    }
  }

  const cancelar = async () => {
    if (!actual) return
    setConfirmando(false)
    setProcesando(true)
    setFallo(null)
    setExito(null)
    try {
      const s = await cancelarSuscripcion(actual.id)
      setLocal({ valor: s })
      setExito('Cancelamos tu suscripción. Puedes elegir un plan otra vez cuando quieras.')
    } catch (e) {
      setFallo(mensajeDeError(e))
    } finally {
      setProcesando(false)
    }
  }

  return (
    <Pantalla titulo="Aruy Pro" atras volverA="/panel">
      <div className="pn-columna">
        <Tarjeta tipo="advertencia" className="pn-bloque" aria-labelledby="pro-simulada">
          <h2 id="pro-simulada">Suscripción simulada</h2>
          <p>En esta versión no se cobra nada: sirve para probar cómo funcionará Aruy Pro.</p>
        </Tarjeta>

        {carga.cargando && <EsqueletosLista lento={carga.lento} texto="Cargando tu suscripción…" alto={120} cantidad={2} />}
        {carga.error && (
          <ErrorReintentar mensaje={carga.error} estadoHttp={carga.estadoHttp} onReintentar={carga.reintentar} />
        )}

        {!carga.cargando && !carga.error && (
          <>
            {exito && <Aviso tipo="exito">{exito}</Aviso>}
            {fallo && <Aviso tipo="error">{fallo}</Aviso>}

            {actual && <Actual s={actual} procesando={procesando} onCancelar={() => setConfirmando(true)} />}

            {puedeContratar(actual) && (
              <form
                className="pn-columna"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!procesando) void activar()
                }}
              >
                <fieldset className="grupo">
                  <legend className="grupo__leyenda">Elige un plan</legend>
                  {PLANES.map((p) => (
                    <label key={p.tipo} className="pro-plan">
                      <input
                        type="radio"
                        name="plan"
                        checked={plan === p.tipo}
                        onChange={() => setPlan(p.tipo)}
                      />
                      <span className="pro-plan__texto">
                        <strong>{p.titulo}</strong>
                        <span className="pro-plan__dias">
                          {p.dias} días. {p.descripcion}
                        </span>
                      </span>
                    </label>
                  ))}
                </fieldset>

                <label className="mc-interruptor">
                  <span>
                    <span className="mc-fila__titulo">Renovación automática</span>
                    <span className="mc-fila__detalle">
                      Se guarda tu preferencia; por ahora no se renueva ni se cobra.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={renovar}
                    onChange={(e) => setRenovar(e.target.checked)}
                  />
                  <span className="mc-interruptor__pista" aria-hidden="true" />
                </label>

                <Boton type="submit" grande ancho cargando={procesando}>
                  {procesando ? 'Activando…' : 'Activar (simulado)'}
                </Boton>
              </form>
            )}
          </>
        )}
      </div>

      <HojaInferior abierta={confirmando} titulo="¿Cancelar tu suscripción?" onCerrar={() => setConfirmando(false)}>
        <p>Dejará de estar activa y podrás elegir un plan otra vez cuando quieras.</p>
        <Boton ancho grande variante="peligro" onClick={() => void cancelar()}>
          Cancelar suscripción
        </Boton>
        <Boton ancho variante="texto" onClick={() => setConfirmando(false)}>
          Mantenerla
        </Boton>
      </HojaInferior>
    </Pantalla>
  )
}
