import { beforeEach, describe, expect, it } from 'vitest'
import { estadoInicialOlvide, guardarOlvide, leerOlvide, limpiarOlvide } from './olvideEstado'

describe('persistencia de «Olvidé mi contraseña»', () => {
  beforeEach(() => sessionStorage.clear())

  it('sin nada guardado empieza en el paso del correo', () => {
    expect(estadoInicialOlvide('')).toEqual({ paso: 'correo', email: '' })
    expect(estadoInicialOlvide('ana@correo.com')).toEqual({ paso: 'correo', email: 'ana@correo.com' })
  })

  it('al recargar en el paso 2 retoma paso y correo', () => {
    guardarOlvide({ paso: 'codigo', email: 'ana@correo.com' })
    expect(estadoInicialOlvide('')).toEqual({ paso: 'codigo', email: 'ana@correo.com' })
    expect(estadoInicialOlvide('ANA@correo.com')).toEqual({ paso: 'codigo', email: 'ana@correo.com' })
  })

  it('si llegas con otro correo, empieza de cero con ese', () => {
    guardarOlvide({ paso: 'codigo', email: 'ana@correo.com' })
    expect(estadoInicialOlvide('luis@correo.com')).toEqual({ paso: 'correo', email: 'luis@correo.com' })
  })

  it('solo se guardan paso y correo: nunca el código ni la contraseña', () => {
    guardarOlvide({ paso: 'codigo', email: 'ana@correo.com', codigo: '123456', password: 'Secreta123' } as never)
    const crudo = sessionStorage.getItem('aruy.olvide') ?? ''
    expect(Object.keys(JSON.parse(crudo)).sort()).toEqual(['email', 'paso'])
    expect(crudo).not.toContain('123456')
    expect(crudo).not.toContain('Secreta123')
  })

  it('limpiar borra el estado y lo ilegible se ignora', () => {
    guardarOlvide({ paso: 'codigo', email: 'ana@correo.com' })
    limpiarOlvide()
    expect(leerOlvide()).toBeNull()
    sessionStorage.setItem('aruy.olvide', '{no es json')
    expect(leerOlvide()).toBeNull()
    sessionStorage.setItem('aruy.olvide', JSON.stringify({ paso: 'listo', email: 'a@b.c' }))
    expect(leerOlvide()).toBeNull()
  })
})
