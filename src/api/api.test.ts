import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErrorApi, peticion, URL_API } from './api'
import { EVENTO_SESION_EXPIRADA, guardarSesion, leerSesion } from './sesion'
import type { Usuario } from './tipos'

const usuario: Usuario = {
  id: 'u1',
  nombre: 'Lucía Cevallos',
  telefono: '0999999999',
  rol: 'CONTRATANTE',
  estado_verificacion: 'NO_VERIFICADO',
  foto_perfil: null,
  activo: true,
}

function responder(estado: number, cuerpo: unknown) {
  return Promise.resolve(
    new Response(cuerpo === null ? null : JSON.stringify(cuerpo), {
      status: estado,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('peticion', () => {
  it('agrega Authorization con el token de la sesion', async () => {
    guardarSesion({ token: 'abc', usuario, perfilPrestadorId: null })
    fetchMock.mockReturnValue(responder(200, { ok: true }))
    await peticion('/usuarios/yo')
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(`${URL_API}/usuarios/yo`)
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer abc')
  })

  it('no envia Authorization cuando token es null', async () => {
    guardarSesion({ token: 'abc', usuario, perfilPrestadorId: null })
    fetchMock.mockReturnValue(responder(200, {}))
    await peticion('/avisos', { token: null })
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('convierte {error} en ErrorApi con estado y mensaje', async () => {
    fetchMock.mockReturnValue(responder(400, { error: 'Id invalido' }))
    const error = await peticion('/servicios/x').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ErrorApi)
    expect((error as ErrorApi).estado).toBe(400)
    expect((error as ErrorApi).mensaje).toBe('Id invalido')
  })

  it('401 con sesion limpia la sesion y emite el evento', async () => {
    guardarSesion({ token: 'vencido', usuario, perfilPrestadorId: null })
    const escucha = vi.fn()
    window.addEventListener(EVENTO_SESION_EXPIRADA, escucha)
    fetchMock.mockReturnValue(responder(401, { error: 'Token invalido' }))
    await expect(peticion('/usuarios/yo')).rejects.toMatchObject({ estado: 401 })
    expect(leerSesion()).toBeNull()
    expect(escucha).toHaveBeenCalledTimes(1)
    window.removeEventListener(EVENTO_SESION_EXPIRADA, escucha)
  })

  it('429 devuelve el mensaje de demasiados intentos', async () => {
    fetchMock.mockReturnValue(responder(429, { error: 'Too many requests' }))
    await expect(peticion('/auth/login', { metodo: 'POST', cuerpo: {} })).rejects.toMatchObject({
      estado: 429,
      mensaje: 'Hiciste muchos intentos. Espera un momento y vuelve a probar.',
    })
  })

  it('un fallo de red dice que se esta conectando', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(peticion('/avisos')).rejects.toMatchObject({ estado: 0, mensaje: 'Conectando con Aruy…' })
  })

  it('el cuerpo binario va crudo con el Content-Type del blob', async () => {
    const imagen = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' })
    fetchMock.mockReturnValue(responder(201, { id: 'f1' }))
    await peticion('/servicios/s1/fotos', { metodo: 'POST', binario: imagen, token: 't' })
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('image/jpeg')
    expect(init.body).toBe(imagen)
  })

  it('el cuerpo JSON se serializa con application/json', async () => {
    fetchMock.mockReturnValue(responder(200, {}))
    await peticion('/auth/login', { metodo: 'POST', cuerpo: { email: 'a@b.c' }, token: null })
    const init = fetchMock.mock.calls[0][1] as RequestInit
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(init.body).toBe('{"email":"a@b.c"}')
  })
})
