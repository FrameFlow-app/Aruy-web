import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { SesionProvider } from '../../api/SesionContexto'
import { guardarSesion } from '../../api/sesion'
import type { Avisos, Usuario } from '../../api/tipos'
import { MiCuenta } from '../../pages/micuenta/MiCuenta'
import { dimensionesRedimension } from './imagen'
import { debeMostrarMantenimiento, describirIntervalo, tocaConsultar } from './mantenimiento'
import { RutaPrivada } from './RutaPrivada'
import { aplicarTema, atributoTema, CLAVE_TEMA, guardarTema, leerTema } from './tema'

describe('dimensionesRedimension', () => {
  it('achica manteniendo la proporción', () => {
    expect(dimensionesRedimension(4000, 3000)).toEqual({ ancho: 512, alto: 384 })
    expect(dimensionesRedimension(3000, 4000)).toEqual({ ancho: 384, alto: 512 })
    expect(dimensionesRedimension(1024, 1024)).toEqual({ ancho: 512, alto: 512 })
  })

  it('no agranda imágenes pequeñas', () => {
    expect(dimensionesRedimension(300, 200)).toEqual({ ancho: 300, alto: 200 })
    expect(dimensionesRedimension(512, 512)).toEqual({ ancho: 512, alto: 512 })
  })

  it('nunca devuelve 0 y tolera medidas inválidas', () => {
    expect(dimensionesRedimension(10000, 1)).toEqual({ ancho: 512, alto: 1 })
    expect(dimensionesRedimension(0, 0)).toEqual({ ancho: 1, alto: 1 })
  })
})

const avisos = (m: Partial<NonNullable<Avisos['mantenimiento']>> | null): Avisos => ({
  mantenimiento: m ? { activo: true, mensaje: 'Mejoras', inicio: null, fin: null, ...m } : null,
  version: { reciente: 0, minima: 0, notas: '' },
})
const ahora = Date.parse('2026-03-10T12:00:00Z')

describe('debeMostrarMantenimiento', () => {
  it('sin aviso o inactivo, no', () => {
    expect(debeMostrarMantenimiento(null, ahora)).toBe(false)
    expect(debeMostrarMantenimiento(avisos(null), ahora)).toBe(false)
    expect(debeMostrarMantenimiento(avisos({ activo: false }), ahora)).toBe(false)
  })

  it('activo sin fechas, sí', () => {
    expect(debeMostrarMantenimiento(avisos({}), ahora)).toBe(true)
  })

  it('respeta inicio y fin', () => {
    const rango = avisos({ inicio: '2026-03-10T10:00:00Z', fin: '2026-03-10T14:00:00Z' })
    expect(debeMostrarMantenimiento(rango, ahora)).toBe(true)
    expect(debeMostrarMantenimiento(rango, new Date('2026-03-10T09:00:00Z'))).toBe(false)
    expect(debeMostrarMantenimiento(rango, new Date('2026-03-10T15:00:00Z'))).toBe(false)
    expect(debeMostrarMantenimiento(avisos({ inicio: '2026-03-11T00:00:00Z' }), ahora)).toBe(false)
    expect(debeMostrarMantenimiento(avisos({ fin: '2026-03-09T00:00:00Z' }), ahora)).toBe(false)
  })

  it('ignora fechas ilegibles', () => {
    expect(debeMostrarMantenimiento(avisos({ inicio: 'no-es-fecha' }), ahora)).toBe(true)
  })
})

describe('describirIntervalo y tocaConsultar', () => {
  it('formatea en español con la hora de Ecuador', () => {
    const t = describirIntervalo('2026-03-10T10:00:00Z', '2026-03-10T14:00:00Z')
    expect(t).toMatch(/^Desde el 10 de marzo de 2026/)
    expect(t).toMatch(/hasta el 10 de marzo de 2026/)
    expect(describirIntervalo(null, '2026-03-10T14:00:00Z')).toMatch(/^Hasta el /)
    expect(describirIntervalo(null, null)).toBeNull()
  })

  it('consulta como mucho cada 10 minutos', () => {
    expect(tocaConsultar(null, 1000)).toBe(true)
    expect(tocaConsultar(1000, 1000 + 9 * 60_000)).toBe(false)
    expect(tocaConsultar(1000, 1000 + 10 * 60_000)).toBe(true)
  })
})

describe('preferencia de tema', () => {
  beforeEach(() => document.documentElement.removeAttribute('data-theme'))

  it('por defecto es Sistema y un valor raro se ignora', () => {
    expect(leerTema()).toBe('sistema')
    localStorage.setItem(CLAVE_TEMA, 'morado')
    expect(leerTema()).toBe('sistema')
  })

  it('guarda y aplica data-theme', () => {
    guardarTema('oscuro')
    expect(leerTema()).toBe('oscuro')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    guardarTema('claro')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    guardarTema('sistema')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    expect(localStorage.getItem(CLAVE_TEMA)).toBeNull()
  })

  it('traduce la preferencia', () => {
    expect(atributoTema('sistema')).toBeNull()
    aplicarTema('oscuro')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})

function Ubicacion() {
  const u = useLocation()
  return <p data-testid="ubicacion">{`${u.pathname}${u.search}`}</p>
}

function montar(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <SesionProvider>
        <Routes>
          <Route path="/ingresar" element={<Ubicacion />} />
          <Route element={<RutaPrivada />}>
            <Route path="/cuenta" element={<MiCuenta />} />
          </Route>
        </Routes>
      </SesionProvider>
    </MemoryRouter>,
  )
}

describe('/cuenta', () => {
  it('sin sesión redirige a Ingresar con ?volver=/cuenta', () => {
    montar('/cuenta')
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/ingresar?volver=%2Fcuenta')
  })

  it('con sesión muestra nombre, rol y opciones', () => {
    const usuario: Usuario = {
      id: '1',
      nombre: 'Lucía Cevallos',
      telefono: '0998765432',
      rol: 'PRESTADOR',
      estado_verificacion: 'NO_VERIFICADO',
      foto_perfil: null,
      activo: true,
    }
    guardarSesion({ token: 'a.b.c', usuario, perfilPrestadorId: 'p1' })
    montar('/cuenta')
    expect(screen.getByRole('heading', { name: 'Lucía Cevallos' })).toBeInTheDocument()
    expect(screen.getByText('Prestador')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Editar perfil/ })).toHaveAttribute('href', '/cuenta/editar')
    expect(screen.getByRole('link', { name: /Ajustes/ })).toHaveAttribute('href', '/cuenta/ajustes')
    expect(screen.getByRole('link', { name: /Cómo instalar en iPhone/ })).toHaveAttribute('href', '/instalar')
    expect(screen.getByRole('button', { name: /Cerrar sesión/ })).toBeInTheDocument()
  })
})
