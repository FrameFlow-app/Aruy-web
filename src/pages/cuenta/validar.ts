// Validaciones de los formularios de cuenta. Mismas reglas y textos que Android (Validaciones.kt);
// cada funcion devuelve el mensaje de error, o null si el valor es valido.

export const NOMBRE_MAX = 60
export const PASSWORD_MIN = 8
/** bcrypt solo usa los primeros 72 bytes de la contrasena. */
export const PASSWORD_MAX_BYTES = 72
export const EDAD_MINIMA = 18
export const LARGO_CODIGO = 6
const EDAD_MAXIMA = 120

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const REGEX_CELULAR_LOCAL = /^09\d{8}$/
const REGEX_CELULAR_INTERNACIONAL = /^\+5939\d{8}$/

export function validarNombre(valor: string): string | null {
  const limpio = valor.trim()
  if (!limpio) return 'Escribe tu nombre completo.'
  if (limpio.length > NOMBRE_MAX) return `El nombre es muy largo. Usa máximo ${NOMBRE_MAX} letras.`
  if (limpio.length < 5 || limpio.split(/\s+/).length < 2) {
    return 'Escribe tu nombre y tu apellido. Ejemplo: Lucía Cevallos.'
  }
  return null
}

export function validarCorreo(valor: string): string | null {
  const limpio = valor.trim()
  if (!limpio) return 'Escribe tu correo.'
  return limpio.length <= 254 && REGEX_CORREO.test(limpio)
    ? null
    : 'Este correo no parece válido. Ejemplo: nombre@correo.com.'
}

/** Quita espacios, guiones, parentesis y puntos: "099 876-5432" -> "0998765432". */
export function normalizarCelular(valor: string): string {
  return valor.replace(/[\s\-().]/g, '')
}

export function validarCelular(valor: string): string | null {
  const limpio = normalizarCelular(valor)
  return REGEX_CELULAR_LOCAL.test(limpio) || REGEX_CELULAR_INTERNACIONAL.test(limpio)
    ? null
    : 'Este número no es válido. Escríbelo así: 0998765432 o +593998765432.'
}

function bytesUtf8(texto: string): number {
  return new TextEncoder().encode(texto).length
}

/** Para crear o cambiar contrasena: 8 a 72 bytes, con letras y numeros. */
export function validarPassword(valor: string): string | null {
  if (!valor) return 'Escribe tu contraseña.'
  if (valor.length < PASSWORD_MIN) return `Usa al menos ${PASSWORD_MIN} caracteres.`
  if (bytesUtf8(valor) > PASSWORD_MAX_BYTES) return 'La contraseña es demasiado larga.'
  if (!/\p{L}/u.test(valor) || !/\p{N}/u.test(valor)) return 'Combina letras y números.'
  return null
}

export function validarConfirmacion(password: string, confirmar: string): string | null {
  if (!confirmar) return 'Repite la contraseña.'
  return password === confirmar ? null : 'Las contraseñas no coinciden.'
}

export function validarCodigo(valor: string): string | null {
  return new RegExp(`^\\d{${LARGO_CODIGO}}$`).test(valor.trim())
    ? null
    : `Escribe el código de ${LARGO_CODIGO} dígitos que te enviamos.`
}

// ---------- Fecha de nacimiento ----------

const relleno = (n: number, largo = 2) => String(n).padStart(largo, '0')

/** Fecha local como AAAA-MM-DD (lo que usa <input type="date"> y el backend). */
export function aFechaIso(fecha: Date): string {
  return `${relleno(fecha.getFullYear(), 4)}-${relleno(fecha.getMonth() + 1)}-${relleno(fecha.getDate())}`
}

/** Lee AAAA-MM-DD; devuelve null si el texto no es una fecha real (p. ej. 2000-02-30). */
export function leerFechaIso(texto: string): { anio: number; mes: number; dia: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto.trim())
  if (!m) return null
  const anio = Number(m[1])
  const mes = Number(m[2])
  const dia = Number(m[3])
  const f = new Date(Date.UTC(anio, mes - 1, dia))
  if (f.getUTCFullYear() !== anio || f.getUTCMonth() !== mes - 1 || f.getUTCDate() !== dia) return null
  return { anio, mes, dia }
}

/** Anios cumplidos en `hoy`. Es negativa si la fecha es futura. Devuelve null si la fecha no es valida. */
export function edadEnAnios(nacimiento: string, hoy: Date = new Date()): number | null {
  const f = leerFechaIso(nacimiento)
  if (!f) return null
  let edad = hoy.getFullYear() - f.anio
  const mes = hoy.getMonth() + 1
  if (mes < f.mes || (mes === f.mes && hoy.getDate() < f.dia)) edad -= 1
  return edad
}

/** Ultimo dia de nacimiento permitido: hoy menos 18 anios (valor `max` del input de fecha). */
export function fechaMaximaNacimiento(hoy: Date = new Date()): string {
  const anio = hoy.getFullYear() - EDAD_MINIMA
  const mes = hoy.getMonth() + 1
  let dia = hoy.getDate()
  // 29 de febrero sin equivalente 18 anios atras: se usa el 28 (cumple los 18 ese mismo dia).
  if (leerFechaIso(`${relleno(anio, 4)}-${relleno(mes)}-${relleno(dia)}`) === null) dia = 28
  return `${relleno(anio, 4)}-${relleno(mes)}-${relleno(dia)}`
}

export function validarFechaNacimiento(valor: string, hoy: Date = new Date()): string | null {
  if (!valor.trim()) return 'Elige tu fecha de nacimiento.'
  const edad = edadEnAnios(valor, hoy)
  if (edad === null) return 'Esa fecha no existe. Revisa el día, el mes y el año.'
  if (edad < 0 || edad > EDAD_MAXIMA) return 'Revisa el año de tu fecha de nacimiento.'
  if (edad < EDAD_MINIMA) return `Aruy es solo para mayores de ${EDAD_MINIMA} años.`
  return null
}
