import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { SesionProvider } from '../../api/SesionContexto'
import { guardarSesion } from '../../api/sesion'
import type { Rol, Usuario } from '../../api/tipos'
import { BarraInferior } from '../../components/BarraInferior'
import type { Suscripcion } from './api'
import { consumirBienvenida, marcarBienvenida } from './bienvenida'
import { redireccionPorRol } from './guardas'
import { FOTOS_META, MAX_SERVICIOS, pasosPerfil, porcentajePerfil, puedePublicarMas, textoPorResponder } from './panel'
import { etiquetaEstado, fechaLarga, PLANES, planDe, puedeCancelar, puedeContratar } from './pro'
import { RutaSoloContratante, RutaSoloPrestador } from './RutasPorRol'
import { destinoTrasAcceso, rutaInicial } from './rutas'
import { validarAnios } from './validar'

describe('rutaInicial / destinoTrasAcceso', () => {
  it('el prestador cae en el panel; el resto, en inicio', () => {
    expect(rutaInicial('PRESTADOR')).toBe('/panel')
    expect(rutaInicial('CONTRATANTE')).toBe('/inicio')
    expect(rutaInicial(null)).toBe('/inicio')
    expect(rutaInicial(undefined)).toBe('/inicio')
  })

  it('sin ?volver= usa la ruta inicial del rol', () => {
    expect(destinoTrasAcceso('PRESTADOR', null)).toBe('/panel')
    expect(destinoTrasAcceso('CONTRATANTE', null)).toBe('/inicio')
    expect(destinoTrasAcceso('PRESTADOR', '')).toBe('/panel')
  })

  it('con ?volver= seguro lo respeta; si no es seguro, vuelve a la ruta del rol', () => {
    expect(destinoTrasAcceso('PRESTADOR', '/solicitudes?tab=recibidas')).toBe('/solicitudes?tab=recibidas')
    expect(destinoTrasAcceso('CONTRATANTE', '/servicio/12')).toBe('/servicio/12')
    expect(destinoTrasAcceso('PRESTADOR', '//evil.com')).toBe('/panel')
    expect(destinoTrasAcceso('PRESTADOR', 'https://evil.com')).toBe('/panel')
  })
})

describe('redireccionPorRol', () => {
  it('sin sesión lleva a Ingresar conservando a dónde ibas', () => {
    expect(redireccionPorRol(null, 'PRESTADOR', '/panel')).toBe('/ingresar?volver=%2Fpanel')
    expect(redireccionPorRol(undefined, 'CONTRATANTE', '/ofrecer')).toBe('/ingresar?volver=%2Fofrecer')
  })

  it('el rol correcto pasa', () => {
    expect(redireccionPorRol('PRESTADOR', 'PRESTADOR', '/panel')).toBeNull()
    expect(redireccionPorRol('CONTRATANTE', 'CONTRATANTE', '/ofrecer')).toBeNull()
  })

  it('el rol equivocado va a su pantalla', () => {
    expect(redireccionPorRol('CONTRATANTE', 'PRESTADOR', '/panel')).toBe('/inicio')
    expect(redireccionPorRol('PRESTADOR', 'CONTRATANTE', '/ofrecer')).toBe('/panel')
  })
})

function entrar(rol: Rol | null) {
  if (rol) {
    const usuario: Usuario = {
      id: '1',
      nombre: 'Lucía Cevallos',
      telefono: '0998765432',
      rol,
      estado_verificacion: 'NO_VERIFICADO',
      foto_perfil: null,
      activo: true,
    }
    guardarSesion({ token: 'a.b.c', usuario, perfilPrestadorId: rol === 'PRESTADOR' ? 'p1' : null })
  }
}

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
          <Route path="/inicio" element={<Ubicacion />} />
          <Route path="/panel" element={<RutaSoloPrestador><p>Panel del prestador</p></RutaSoloPrestador>} />
          <Route element={<RutaSoloContratante />}>
            <Route path="/ofrecer" element={<p>Pantalla de ofrecer</p>} />
          </Route>
        </Routes>
      </SesionProvider>
    </MemoryRouter>,
  )
}

describe('guardas por rol', () => {
  beforeEach(() => localStorage.clear())

  it('/panel sin sesión va a Ingresar con ?volver=', () => {
    montar('/panel')
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/ingresar?volver=%2Fpanel')
  })

  it('/panel con un contratante va a Inicio', () => {
    entrar('CONTRATANTE')
    montar('/panel')
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/inicio')
  })

  it('/panel con un prestador entra', () => {
    entrar('PRESTADOR')
    montar('/panel')
    expect(screen.getByText('Panel del prestador')).toBeInTheDocument()
  })

  it('/ofrecer: contratante entra, prestador va al panel, sin sesión va a Ingresar', () => {
    entrar('CONTRATANTE')
    const { unmount } = montar('/ofrecer')
    expect(screen.getByText('Pantalla de ofrecer')).toBeInTheDocument()
    unmount()

    localStorage.clear()
    entrar('PRESTADOR')
    const segundo = montar('/ofrecer')
    expect(screen.getByText('Panel del prestador')).toBeInTheDocument()
    segundo.unmount()

    localStorage.clear()
    montar('/ofrecer')
    expect(screen.getByTestId('ubicacion')).toHaveTextContent('/ingresar?volver=%2Fofrecer')
  })
})

describe('barra inferior por rol', () => {
  function barra() {
    return render(
      <MemoryRouter initialEntries={['/inicio']}>
        <SesionProvider>
          <BarraInferior />
        </SesionProvider>
      </MemoryRouter>,
    )
  }
  const textos = () => screen.getAllByRole('link').map((a) => a.textContent)

  it('invitado: Inicio, Buscar e Ingresar', () => {
    barra()
    expect(textos()).toEqual(['Inicio', 'Buscar', 'Ingresar'])
  })

  it('contratante: Inicio, Buscar y Cuenta', () => {
    entrar('CONTRATANTE')
    barra()
    expect(textos()).toEqual(['Inicio', 'Buscar', 'Cuenta'])
  })

  it('prestador: Panel, Servicios, Portafolio, Explorar y Cuenta', () => {
    entrar('PRESTADOR')
    barra()
    expect(textos()).toEqual(['Panel', 'Servicios', 'Portafolio', 'Explorar', 'Cuenta'])
    expect(screen.getByRole('link', { name: 'Panel' })).toHaveAttribute('href', '/panel')
    expect(screen.getByRole('link', { name: 'Portafolio' })).toHaveAttribute('href', '/portafolio')
    expect(screen.getByRole('link', { name: 'Explorar' })).toHaveAttribute('href', '/inicio')
  })
})

const suscripcion = (estado: string): Suscripcion => ({
  id: 's1',
  tipo_plan: 'ARUY_PRO_SEMANAL',
  estado,
  fecha_inicio: '2026-10-18T12:00:00.000Z',
  fecha_fin: '2026-10-25T12:00:00.000Z',
  renovacion_automatica: false,
})

describe('estado de Aruy Pro', () => {
  it('sin suscripción, canceladas y vencidas se puede contratar; activas y pendientes no', () => {
    expect(puedeContratar(null)).toBe(true)
    expect(puedeContratar(suscripcion('CANCELADA'))).toBe(true)
    expect(puedeContratar(suscripcion('VENCIDA'))).toBe(true)
    expect(puedeContratar(suscripcion('ACTIVA'))).toBe(false)
    expect(puedeContratar(suscripcion('PENDIENTE'))).toBe(false)
  })

  it('solo se cancelan las activas y las pendientes', () => {
    expect(puedeCancelar(null)).toBe(false)
    expect(puedeCancelar(suscripcion('ACTIVA'))).toBe(true)
    expect(puedeCancelar(suscripcion('PENDIENTE'))).toBe(true)
    expect(puedeCancelar(suscripcion('CANCELADA'))).toBe(false)
    expect(puedeCancelar(suscripcion('VENCIDA'))).toBe(false)
  })

  it('planes de 7 y 30 días y etiquetas de estado', () => {
    expect(PLANES.map((p) => [p.tipo, p.dias])).toEqual([
      ['ARUY_PRO_SEMANAL', 7],
      ['ARUY_PRO_MENSUAL', 30],
    ])
    expect(planDe('ARUY_PRO_MENSUAL')?.titulo).toBe('Aruy Pro mensual')
    expect(planDe('OTRO')).toBeUndefined()
    expect(etiquetaEstado('ACTIVA')).toBe('Activa')
    expect(etiquetaEstado('VENCIDA')).toBe('Vencida')
  })

  it('formatea fechas en español de Ecuador', () => {
    expect(fechaLarga('2026-10-25T12:00:00.000Z', 'America/Guayaquil')).toBe('25 de octubre de 2026')
    expect(fechaLarga(null)).toBeNull()
    expect(fechaLarga('no-es-fecha')).toBeNull()
  })
})

describe('panel del prestador', () => {
  it('«Completa tu perfil» avanza con el primer servicio y las 3 fotos', () => {
    expect(pasosPerfil(0, 0).map((p) => p.hecho)).toEqual([false, false])
    expect(pasosPerfil(1, FOTOS_META - 1).map((p) => p.hecho)).toEqual([true, false])
    expect(pasosPerfil(2, FOTOS_META).map((p) => p.hecho)).toEqual([true, true])
    expect(porcentajePerfil(pasosPerfil(0, 0))).toBe(0)
    expect(porcentajePerfil(pasosPerfil(1, 0))).toBe(50)
    expect(porcentajePerfil(pasosPerfil(1, 3))).toBe(100)
  })

  it('se pueden publicar hasta dos servicios', () => {
    expect(MAX_SERVICIOS).toBe(2)
    expect(puedePublicarMas(0)).toBe(true)
    expect(puedePublicarMas(1)).toBe(true)
    expect(puedePublicarMas(2)).toBe(false)
  })

  it('texto de solicitudes por responder', () => {
    expect(textoPorResponder(3)).toBe('Tienes 3 por responder.')
    expect(textoPorResponder(0)).toMatch(/Aquí aparecen/)
  })
})

describe('activar prestador', () => {
  it('años de experiencia: opcional, de 0 a 80', () => {
    expect(validarAnios('')).toEqual({ valor: null, error: null })
    expect(validarAnios(' 5 ')).toEqual({ valor: 5, error: null })
    expect(validarAnios('0')).toEqual({ valor: 0, error: null })
    expect(validarAnios('80')).toEqual({ valor: 80, error: null })
    expect(validarAnios('81').error).toMatch(/entre 0 y 80/)
    expect(validarAnios('abc').error).toMatch(/entre 0 y 80/)
  })

  it('el aviso de bienvenida se muestra una sola vez', () => {
    sessionStorage.clear()
    expect(consumirBienvenida()).toBe(false)
    marcarBienvenida()
    expect(consumirBienvenida()).toBe(true)
    expect(consumirBienvenida()).toBe(false)
  })
})
