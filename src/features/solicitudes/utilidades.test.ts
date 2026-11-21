import { describe, expect, it } from 'vitest'
import type { MensajeChat, MensajeLocal, Solicitud } from './tipos'
import {
  accionesPermitidas,
  agruparPorDia,
  chatAbierto,
  combinarSolicitud,
  etiquetaDia,
  fechaRelativa,
  fusionarMensajes,
  normalizarWhatsapp,
  sinLocalesConfirmados,
  totalNoLeidos,
  ultimaFecha,
  urlWhatsapp,
} from './utilidades'

function msg(id: string, fecha: string, extra: Partial<MensajeChat> = {}): MensajeChat {
  return { id, autor_id: 'u', es_mio: false, texto: id, tipo: 'TEXTO', fecha_creacion: fecha, ...extra }
}

describe('normalizarWhatsapp', () => {
  it('convierte el 0 inicial en 593', () => {
    expect(normalizarWhatsapp('0991234567')).toBe('593991234567')
  })
  it('quita +, espacios y guiones', () => {
    expect(normalizarWhatsapp('+593 99 123-4567')).toBe('593991234567')
    expect(normalizarWhatsapp('593991234567')).toBe('593991234567')
  })
  it('rechaza lo que no es celular ecuatoriano', () => {
    expect(normalizarWhatsapp('12345')).toBeNull()
    expect(normalizarWhatsapp('')).toBeNull()
    expect(normalizarWhatsapp(null)).toBeNull()
    expect(normalizarWhatsapp('+1 415 555 2671')).toBeNull()
  })
  it('arma la URL de wa.me, con saludo opcional', () => {
    expect(urlWhatsapp('0991234567')).toBe('https://wa.me/593991234567')
    expect(urlWhatsapp('0991234567', 'Hola Ana')).toBe('https://wa.me/593991234567?text=Hola%20Ana')
    expect(urlWhatsapp('abc')).toBeNull()
  })
})

describe('accionesPermitidas', () => {
  it('prestador: responde y cierra', () => {
    expect(accionesPermitidas('PENDIENTE', true)).toEqual(['ACEPTADA', 'RECHAZADA'])
    expect(accionesPermitidas('ACEPTADA', true)).toEqual(['COMPLETADA', 'CANCELADA'])
  })
  it('contratante: solo cancela mientras esté viva', () => {
    expect(accionesPermitidas('PENDIENTE', false)).toEqual(['CANCELADA'])
    expect(accionesPermitidas('ACEPTADA', false)).toEqual(['CANCELADA'])
  })
  it('estados finales no tienen acciones', () => {
    for (const e of ['RECHAZADA', 'CANCELADA', 'COMPLETADA'] as const) {
      expect(accionesPermitidas(e, true)).toEqual([])
      expect(accionesPermitidas(e, false)).toEqual([])
    }
  })
  it('el chat se cierra al rechazar o cancelar', () => {
    expect(chatAbierto('RECHAZADA')).toBe(false)
    expect(chatAbierto('CANCELADA')).toBe(false)
    expect(chatAbierto('COMPLETADA')).toBe(true)
    expect(chatAbierto('PENDIENTE')).toBe(true)
  })
})

describe('fechas', () => {
  const ahora = new Date(2026, 10, 21, 15, 0, 0).getTime()
  const hace = (ms: number) => new Date(ahora - ms).toISOString()

  it('fecha relativa', () => {
    expect(fechaRelativa(hace(10_000), ahora)).toBe('ahora')
    expect(fechaRelativa(hace(5 * 60_000), ahora)).toBe('hace 5 min')
    expect(fechaRelativa(hace(2 * 3_600_000), ahora)).toBe('hace 2 h')
    expect(fechaRelativa(new Date(2026, 10, 20, 9, 0).toISOString(), ahora)).toBe('ayer')
    expect(fechaRelativa(new Date(2026, 10, 18, 9, 0).toISOString(), ahora)).toBe('hace 3 días')
    expect(fechaRelativa(null, ahora)).toBe('')
    expect(fechaRelativa('no es fecha', ahora)).toBe('')
  })

  it('etiqueta de día', () => {
    expect(etiquetaDia(new Date(2026, 10, 21, 8, 0).toISOString(), ahora)).toBe('Hoy')
    expect(etiquetaDia(new Date(2026, 10, 20, 23, 0).toISOString(), ahora)).toBe('Ayer')
    expect(etiquetaDia(new Date(2026, 10, 1, 8, 0).toISOString(), ahora)).toMatch(/1.*noviembre/)
    expect(etiquetaDia(new Date(2025, 10, 1, 8, 0).toISOString(), ahora)).toMatch(/2025/)
  })

  it('agrupa por día conservando el orden', () => {
    const a = msg('a', new Date(2026, 10, 20, 9, 0).toISOString())
    const b = msg('b', new Date(2026, 10, 20, 22, 0).toISOString())
    const c = msg('c', new Date(2026, 10, 21, 8, 0).toISOString())
    const grupos = agruparPorDia([a, b, c], ahora)
    expect(grupos.map((g) => g.etiqueta)).toEqual(['Ayer', 'Hoy'])
    expect(grupos[0].mensajes.map((m) => m.id)).toEqual(['a', 'b'])
    expect(grupos[1].mensajes.map((m) => m.id)).toEqual(['c'])
  })
})

describe('mensajes', () => {
  it('fusiona sin duplicar por id y ordena por fecha', () => {
    const actuales = [msg('1', '2026-11-21T10:00:00.000Z'), msg('2', '2026-11-21T10:01:00.000Z')]
    const nuevos = [msg('2', '2026-11-21T10:01:00.000Z'), msg('3', '2026-11-21T10:02:00.000Z'), msg('0', '2026-11-21T09:59:00.000Z')]
    expect(fusionarMensajes(actuales, nuevos).map((m) => m.id)).toEqual(['0', '1', '2', '3'])
  })

  it('sin nuevos devuelve lo mismo', () => {
    const actuales = [msg('1', '2026-11-21T10:00:00.000Z')]
    expect(fusionarMensajes(actuales, [])).toBe(actuales)
  })

  it('la última fecha sirve para pedir solo lo nuevo', () => {
    expect(ultimaFecha([])).toBeNull()
    expect(ultimaFecha([msg('1', 'a'), msg('2', 'b')])).toBe('b')
  })

  it('quita el envío local que el servidor ya devolvió', () => {
    const local = (id: string, texto: string, estadoLocal: MensajeLocal['estadoLocal']): MensajeLocal => ({
      ...msg(id, '2026-11-21T10:00:00.000Z', { es_mio: true, texto }),
      estadoLocal,
    })
    const locales = [local('l1', 'hola', 'enviando'), local('l2', 'otro', 'fallido')]
    const nuevos = [msg('s1', '2026-11-21T10:00:01.000Z', { es_mio: true, texto: 'hola' })]
    expect(sinLocalesConfirmados(locales, nuevos).map((l) => l.id)).toEqual(['l2'])
  })
})

describe('solicitudes', () => {
  const base: Solicitud = {
    id: 's1',
    servicio_id: 'x',
    servicio_titulo: 'Plomería',
    estado: 'PENDIENTE',
    mensaje: 'Hola',
    respuesta: null,
    fecha_creacion: '2026-11-21T10:00:00.000Z',
    fecha_actualizacion: null,
    sin_ver: false,
    whatsapp_compartido: false,
    mensajes_sin_leer: 2,
    ultimo_mensaje: { texto: 'hola', fecha: '2026-11-21T10:00:00.000Z' },
    contraparte: { nombre: 'Ana', foto_perfil: null, telefono: null },
  }

  it('tras un PATCH conserva la otra persona y el chat', () => {
    const respuesta: Solicitud = {
      ...base,
      estado: 'ACEPTADA',
      respuesta: 'Dale',
      mensajes_sin_leer: 0,
      ultimo_mensaje: null,
      contraparte: { nombre: 'Cuenta eliminada', foto_perfil: null, telefono: null },
    }
    const r = combinarSolicitud(base, respuesta)
    expect(r.estado).toBe('ACEPTADA')
    expect(r.respuesta).toBe('Dale')
    expect(r.contraparte.nombre).toBe('Ana')
    expect(r.mensajes_sin_leer).toBe(2)
  })

  it('suma los no leídos de la campana', () => {
    expect(totalNoLeidos({ recibidas_nuevas: 1, enviadas_novedades: 2, mensajes_sin_leer: 3 })).toBe(6)
    expect(totalNoLeidos({ recibidas_nuevas: 0, enviadas_novedades: 0, mensajes_sin_leer: 0 })).toBe(0)
  })
})
