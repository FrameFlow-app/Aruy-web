import { describe, expect, it } from 'vitest'
import {
  edadEnAnios,
  fechaMaximaNacimiento,
  normalizarCelular,
  validarCelular,
  validarCodigo,
  validarConfirmacion,
  validarCorreo,
  validarFechaNacimiento,
  validarNombre,
  validarPassword,
} from './validar'
import { rutaVolverSegura } from './volver'

// Fecha local: 15 de marzo de 2026.
const hoy = new Date(2026, 2, 15)

describe('fecha de nacimiento (18+)', () => {
  it('cumple 18 justo hoy: es valido', () => {
    expect(edadEnAnios('2008-03-15', hoy)).toBe(18)
    expect(validarFechaNacimiento('2008-03-15', hoy)).toBeNull()
  })

  it('cumple 18 manana: aun no es valido', () => {
    expect(edadEnAnios('2008-03-16', hoy)).toBe(17)
    expect(validarFechaNacimiento('2008-03-16', hoy)).toBe('Aruy es solo para mayores de 18 años.')
  })

  it('cumplio 18 ayer: es valido', () => {
    expect(validarFechaNacimiento('2008-03-14', hoy)).toBeNull()
  })

  it('rechaza futuro, vacio, inexistente y demasiado antigua', () => {
    expect(validarFechaNacimiento('2030-01-01', hoy)).toMatch(/Revisa el año/)
    expect(validarFechaNacimiento('', hoy)).toMatch(/Elige/)
    expect(validarFechaNacimiento('2000-02-30', hoy)).toMatch(/no existe/)
    expect(validarFechaNacimiento('1800-01-01', hoy)).toMatch(/Revisa el año/)
  })

  it('el max del input es hoy menos 18 anios y coincide con la validacion', () => {
    expect(fechaMaximaNacimiento(hoy)).toBe('2008-03-15')
    expect(validarFechaNacimiento(fechaMaximaNacimiento(hoy), hoy)).toBeNull()
  })

  it('29 de febrero: el max cae en 28 y es valido', () => {
    const bisiesto = new Date(2028, 1, 29)
    const max = fechaMaximaNacimiento(bisiesto)
    expect(max).toBe('2010-02-28')
    expect(validarFechaNacimiento(max, bisiesto)).toBeNull()
  })
})

describe('correo', () => {
  it('acepta correos normales', () => {
    expect(validarCorreo('lucia@correo.com')).toBeNull()
    expect(validarCorreo('  lucia@correo.com ')).toBeNull()
  })
  it('rechaza vacio y mal formados', () => {
    expect(validarCorreo('')).not.toBeNull()
    expect(validarCorreo('lucia')).not.toBeNull()
    expect(validarCorreo('lucia@correo')).not.toBeNull()
    expect(validarCorreo('lu cia@correo.com')).not.toBeNull()
  })
})

describe('celular de Ecuador', () => {
  it('acepta formatos locales e internacionales con separadores', () => {
    expect(validarCelular('0998765432')).toBeNull()
    expect(validarCelular('099 876-5432')).toBeNull()
    expect(validarCelular('+593998765432')).toBeNull()
    expect(normalizarCelular('(099) 876.5432')).toBe('0998765432')
  })
  it('rechaza otros', () => {
    expect(validarCelular('')).not.toBeNull()
    expect(validarCelular('0298765432')).not.toBeNull()
    expect(validarCelular('099876543')).not.toBeNull()
    expect(validarCelular('+573998765432')).not.toBeNull()
  })
})

describe('contrasena', () => {
  it('acepta 8+ con letras y numeros', () => {
    expect(validarPassword('clave1234')).toBeNull()
  })
  it('rechaza corta, sin numeros, sin letras y vacia', () => {
    expect(validarPassword('')).not.toBeNull()
    expect(validarPassword('abc123')).toMatch(/al menos 8/)
    expect(validarPassword('solo letras')).toMatch(/letras y números/)
    expect(validarPassword('12345678')).toMatch(/letras y números/)
  })
  it('limita a 72 bytes (no a 72 caracteres)', () => {
    expect(validarPassword('a1'.repeat(36))).toBeNull() // 72 bytes
    expect(validarPassword('a1'.repeat(36) + 'b')).toMatch(/larga/)
    expect(validarPassword('ñ1'.repeat(25))).toMatch(/larga/) // 50 caracteres, 75 bytes
  })
  it('confirmacion', () => {
    expect(validarConfirmacion('clave1234', 'clave1234')).toBeNull()
    expect(validarConfirmacion('clave1234', 'clave12345')).toMatch(/no coinciden/)
    expect(validarConfirmacion('clave1234', '')).not.toBeNull()
  })
})

describe('nombre y codigo', () => {
  it('pide nombre y apellido', () => {
    expect(validarNombre('Lucía Cevallos')).toBeNull()
    expect(validarNombre('Lucía')).not.toBeNull()
    expect(validarNombre('')).not.toBeNull()
  })
  it('el codigo son 6 digitos', () => {
    expect(validarCodigo('123456')).toBeNull()
    expect(validarCodigo('12345')).not.toBeNull()
    expect(validarCodigo('12345a')).not.toBeNull()
  })
})

describe('rutaVolverSegura', () => {
  it('acepta rutas internas', () => {
    expect(rutaVolverSegura('/servicio/abc')).toBe('/servicio/abc')
    expect(rutaVolverSegura('/buscar?q=plomero')).toBe('/buscar?q=plomero')
  })
  it('usa el valor por defecto sin parametro', () => {
    expect(rutaVolverSegura(null)).toBe('/inicio')
    expect(rutaVolverSegura('')).toBe('/inicio')
    expect(rutaVolverSegura(undefined, '/x')).toBe('/x')
  })
  it('descarta destinos externos o raros', () => {
    expect(rutaVolverSegura('https://malo.com')).toBe('/inicio')
    expect(rutaVolverSegura('//malo.com')).toBe('/inicio')
    expect(rutaVolverSegura('/\\malo.com')).toBe('/inicio')
    expect(rutaVolverSegura('javascript:alert(1)')).toBe('/inicio')
    expect(rutaVolverSegura('inicio')).toBe('/inicio')
    expect(rutaVolverSegura('/a\\b')).toBe('/inicio')
    expect(rutaVolverSegura('/a\nb')).toBe('/inicio')
  })
})
