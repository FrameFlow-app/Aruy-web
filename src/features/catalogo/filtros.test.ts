import { describe, expect, it } from 'vitest'
import type { PerfilPublico, Servicio } from '../../api/tipos'
import {
  cantidadActivos,
  disponibleAhora,
  filtrarServicios,
  FILTROS_VACIOS,
  filtrosAQuery,
  filtrosDesdeQuery,
  formatoDinero,
  normalizar,
  textoPrecio,
  type ServicioConPrestador,
} from './filtros'

function servicio(p: Partial<Servicio>): Servicio {
  return {
    id: 's',
    prestador_id: 'p1',
    titulo: 'Servicio',
    descripcion: '',
    categoria: 'OTROS',
    precio_referencial: null,
    disponible: true,
    ...p,
  }
}

function prestador(p: Partial<PerfilPublico>): PerfilPublico {
  return {
    id: 'p1',
    usuario_id: 'u1',
    nombre: 'Ana Pérez',
    telefono: '',
    foto_perfil: null,
    estado_verificacion: 'VERIFICADA',
    oficio_principal: null,
    descripcion_profesional: null,
    zona_cobertura: 'Quito Norte',
    anios_experiencia: null,
    disponible: true,
    calificacion_promedio: null,
    total_calificaciones: 0,
    ...p,
  }
}

const catalogo: ServicioConPrestador[] = [
  {
    servicio: servicio({ id: 'a', titulo: 'Reparación de tuberías', categoria: 'PLOMERIA', precio_referencial: 15 }),
    prestador: prestador({ calificacion_promedio: 4.2, total_calificaciones: 5, oficio_principal: 'Plomero' }),
  },
  {
    servicio: servicio({ id: 'b', titulo: 'Instalación eléctrica', categoria: 'ELECTRICIDAD', precio_referencial: 60, prestador_id: 'p2' }),
    prestador: prestador({ id: 'p2', nombre: 'Luis Mora', zona_cobertura: 'Sur', calificacion_promedio: 4.9, total_calificaciones: 12 }),
  },
  {
    servicio: servicio({ id: 'c', titulo: 'Manicure a domicilio', categoria: 'BELLEZA', precio_referencial: null, disponible: false, prestador_id: 'p3' }),
    prestador: null,
  },
]

const ids = (items: ServicioConPrestador[]) => items.map((i) => i.servicio.id)

describe('normalizar', () => {
  it('quita tildes y mayúsculas', () => {
    expect(normalizar('  Plomería ÁÉÍÓÚ ñ ')).toBe('plomeria aeiou n')
  })
})

describe('filtrarServicios', () => {
  it('sin filtros devuelve todo, mejor calificados primero', () => {
    expect(ids(filtrarServicios(catalogo, FILTROS_VACIOS))).toEqual(['b', 'a', 'c'])
  })

  it('busca sin importar tildes ni mayúsculas, y en el oficio y el nombre del prestador', () => {
    expect(ids(filtrarServicios(catalogo, { ...FILTROS_VACIOS, texto: 'REPARACION' }))).toEqual(['a'])
    expect(ids(filtrarServicios(catalogo, { ...FILTROS_VACIOS, texto: 'plomero' }))).toEqual(['a'])
    expect(ids(filtrarServicios(catalogo, { ...FILTROS_VACIOS, texto: 'luis' }))).toEqual(['b'])
  })

  it('exige todas las palabras y acepta plurales', () => {
    expect(ids(filtrarServicios(catalogo, { ...FILTROS_VACIOS, texto: 'instalaciones electricas' }))).toEqual(['b'])
    expect(filtrarServicios(catalogo, { ...FILTROS_VACIOS, texto: 'instalación pintura' })).toEqual([])
  })

  it('filtra por categoría, zona, precio máximo y disponibilidad', () => {
    expect(ids(filtrarServicios(catalogo, { ...FILTROS_VACIOS, categoria: 'BELLEZA' }))).toEqual(['c'])
    expect(ids(filtrarServicios(catalogo, { ...FILTROS_VACIOS, zona: 'sur' }))).toEqual(['b'])
    expect(ids(filtrarServicios(catalogo, { ...FILTROS_VACIOS, precioMax: 20 }))).toEqual(['a', 'c'])
    expect(ids(filtrarServicios(catalogo, { ...FILTROS_VACIOS, soloDisponibles: true }))).toEqual(['b', 'a'])
  })
})

describe('disponibleAhora', () => {
  it('requiere servicio activo y prestador disponible', () => {
    expect(disponibleAhora(catalogo[0])).toBe(true)
    expect(disponibleAhora(catalogo[2])).toBe(false)
    expect(disponibleAhora({ servicio: servicio({}), prestador: prestador({ disponible: false }) })).toBe(false)
  })
})

describe('filtros en la URL', () => {
  it('ida y vuelta', () => {
    const f = { texto: 'tubo roto', categoria: 'PLOMERIA', zona: 'Norte', precioMax: 40, soloDisponibles: true }
    expect(filtrosDesdeQuery(filtrosAQuery(f))).toEqual(f)
    expect(cantidadActivos(f)).toBe(4)
  })

  it('ignora valores inválidos y acepta ?categoria= en cualquier caso', () => {
    const f = filtrosDesdeQuery(new URLSearchParams('categoria=plomeria&zona=Marte&precio=abc'))
    expect(f.categoria).toBe('PLOMERIA')
    expect(f.zona).toBeNull()
    expect(f.precioMax).toBeNull()
    expect(filtrosDesdeQuery(new URLSearchParams('categoria=XX')).categoria).toBeNull()
  })
})

describe('formato de precio', () => {
  it('muestra enteros sin decimales y decimales con coma', () => {
    expect(formatoDinero(20)).toBe('$20')
    expect(formatoDinero(12.5)).toBe('$12,50')
    expect(textoPrecio(null)).toBe('Precio a convenir')
    expect(textoPrecio(20)).toBe('Desde $20')
  })
})
