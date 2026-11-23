import { describe, expect, it } from 'vitest'
import {
  cupoFotos,
  cupoServicios,
  normalizarTitulo,
  validarCategoria,
  validarDescripcion,
  validarFotos,
  validarPrecio,
  validarTitulo,
} from './validacion'

describe('normalizarTitulo (mismos casos que el backend)', () => {
  it('deja inicial en mayúscula y el resto en minúscula', () => {
    expect(normalizarTitulo('LIMPIEZA DE CASAS')).toBe('Limpieza de casas')
    expect(normalizarTitulo('limpieza de casas')).toBe('Limpieza de casas')
    expect(normalizarTitulo('  LiMpIeZa   dE  cAsAs  ')).toBe('Limpieza de casas')
    expect(normalizarTitulo('ÁRBOL DE NAVIDAD')).toBe('Árbol de navidad')
    expect(normalizarTitulo('ñandú Y MÁS')).toBe('Ñandú y más')
    expect(normalizarTitulo('   ')).toBe('')
    expect(normalizarTitulo(undefined)).toBe('')
  })
})

describe('validaciones del servicio', () => {
  it('título: al menos 4 letras y máximo 60', () => {
    expect(validarTitulo('ab 12')).toMatch(/4 letras/)
    expect(validarTitulo('Pintura')).toBeNull()
    expect(validarTitulo('a'.repeat(61))).toMatch(/60/)
    expect(validarTitulo('a'.repeat(60))).toBeNull()
  })
  it('descripción: al menos 20 letras y máximo 500', () => {
    expect(validarDescripcion('corta')).toMatch(/20 letras/)
    expect(validarDescripcion('Arreglo fugas y cambio llaves de agua')).toBeNull()
    expect(validarDescripcion('a'.repeat(501))).toMatch(/500/)
  })
  it('precio: vacío es a convenir; si se escribe, entre 0 y 10 000', () => {
    expect(validarPrecio('')).toEqual({ valor: null, error: null })
    expect(validarPrecio('  ')).toEqual({ valor: null, error: null })
    expect(validarPrecio('15')).toEqual({ valor: 15, error: null })
    expect(validarPrecio('12,50')).toEqual({ valor: 12.5, error: null })
    expect(validarPrecio('0').error).not.toBeNull()
    expect(validarPrecio('-3').error).not.toBeNull()
    expect(validarPrecio('10000').error).not.toBeNull()
    expect(validarPrecio('9999.99').valor).toBe(9999.99)
    expect(validarPrecio('abc').error).not.toBeNull()
    expect(validarPrecio('1e3').error).not.toBeNull()
  })
  it('fotos y categoría', () => {
    expect(validarFotos(0)).toMatch(/al menos una foto/)
    expect(validarFotos(1)).toBeNull()
    expect(validarCategoria(null)).toMatch(/categoría/)
    expect(validarCategoria('PINTURA')).toBeNull()
  })
})

describe('cupos', () => {
  it('servicios: máximo 2', () => {
    expect(cupoServicios(0)).toEqual({ restante: 2, lleno: false })
    expect(cupoServicios(1)).toEqual({ restante: 1, lleno: false })
    expect(cupoServicios(2)).toEqual({ restante: 0, lleno: true })
    expect(cupoServicios(5)).toEqual({ restante: 0, lleno: true })
  })
  it('fotos: máximo 3 entre guardadas y nuevas', () => {
    expect(cupoFotos(0)).toEqual({ restante: 3, lleno: false })
    expect(cupoFotos(1, 1)).toEqual({ restante: 1, lleno: false })
    expect(cupoFotos(2, 1)).toEqual({ restante: 0, lleno: true })
    expect(cupoFotos(3, 2).restante).toBe(0)
  })
})
