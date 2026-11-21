import { describe, expect, it } from 'vitest'
import { borrarSesion, debeRenovar, decodificarToken, guardarSesion, leerSesion, tokenVencido } from './sesion'
import type { Usuario } from './tipos'

function jwt(carga: Record<string, unknown>): string {
  const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(carga)}.firma`
}

const AHORA = Date.UTC(2026, 0, 31, 12) // ms
const s = AHORA / 1000
const DIA = 86400

describe('debeRenovar', () => {
  it('no renueva un token emitido hace menos de un dia', () => {
    expect(debeRenovar(jwt({ iat: s - DIA / 2, exp: s + 29 * DIA }), AHORA)).toBe(false)
  })

  it('renueva un token con mas de un dia de emitido', () => {
    expect(debeRenovar(jwt({ iat: s - 2 * DIA, exp: s + 28 * DIA }), AHORA)).toBe(true)
  })

  it('no renueva uno ya vencido: toca volver a ingresar', () => {
    expect(debeRenovar(jwt({ iat: s - 31 * DIA, exp: s - DIA }), AHORA)).toBe(false)
    expect(tokenVencido(jwt({ iat: s - 31 * DIA, exp: s - DIA }), AHORA)).toBe(true)
  })

  it('no renueva un token ilegible o sin iat', () => {
    expect(debeRenovar('basura', AHORA)).toBe(false)
    expect(debeRenovar(jwt({ exp: s + DIA }), AHORA)).toBe(false)
  })
})

describe('decodificarToken', () => {
  it('lee iat y exp, incluso con caracteres no ASCII', () => {
    expect(decodificarToken(jwt({ iat: 1, exp: 2, nombre: 'Lucía' }))).toMatchObject({ iat: 1, exp: 2 })
  })
})

describe('almacenamiento de sesion', () => {
  const usuario: Usuario = {
    id: 'u1',
    nombre: 'Ana',
    telefono: '1',
    rol: 'PRESTADOR',
    estado_verificacion: 'VERIFICADO',
    foto_perfil: null,
    activo: true,
  }

  it('guarda, lee y borra', () => {
    guardarSesion({ token: 't', usuario, perfilPrestadorId: 'p1' })
    expect(leerSesion()).toMatchObject({ token: 't', perfilPrestadorId: 'p1' })
    borrarSesion()
    expect(leerSesion()).toBeNull()
  })

  it('ignora datos corruptos', () => {
    localStorage.setItem('aruy.sesion', '{no es json')
    expect(leerSesion()).toBeNull()
  })
})
