import { useCallback, useEffect, useRef, useState } from 'react'
import { ErrorApi } from '../../api/api'

/**
 * Lleva el foco al primer campo con error. Se llama a `pedir()` justo despues de fijar los errores;
 * el efecto corre ya con el DOM actualizado (aria-invalid puesto).
 */
export function useEnfocarPrimerError() {
  const formulario = useRef<HTMLFormElement>(null)
  const [pedido, setPedido] = useState(0)
  const pedir = useCallback(() => setPedido((n) => n + 1), [])
  useEffect(() => {
    if (pedido === 0) return
    formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [pedido])
  return { formulario, pedir }
}

const MENSAJE_SIN_CONEXION = 'No pudimos conectar con Aruy. Revisa tu internet y vuelve a intentarlo.'

/** Texto en español para mostrar un fallo de la API. */
export function mensajeDeError(e: unknown): string {
  if (e instanceof ErrorApi) return e.esDeRed ? MENSAJE_SIN_CONEXION : e.mensaje
  return 'No pudimos completar eso. Prueba de nuevo.'
}
