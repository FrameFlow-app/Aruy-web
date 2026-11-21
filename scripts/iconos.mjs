// Genera los PNG de la app a partir del vector de Android (108x108): "A" blanca y costura de maiz sobre anil.
// Uso: npm run iconos
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const salida = path.join(raiz, 'public', 'icons')
await mkdir(salida, { recursive: true })

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">
  <rect width="108" height="108" fill="#2B3990"/>
  <g transform="translate(10.48 10.48) scale(0.17)" fill="none">
    <path d="M130,398 L256,114 L382,398" stroke="#FFFFFF" stroke-width="58" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M200,318h22M245,318h22M290,318h22" stroke="#F2B52E" stroke-width="34" stroke-linecap="round"/>
  </g></svg>`)

// El glifo ya cabe en la zona segura (66/108), por eso sirve igual para "maskable".
// iOS aplica sus propias esquinas, asi que el apple-touch-icon va a sangre completa.
const iconos = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['maskable-512.png', 512],
  ['apple-touch-icon-180.png', 180],
]

for (const [nombre, tam] of iconos) {
  await sharp(svg, { density: 576 }).resize(tam, tam).png().toFile(path.join(salida, nombre))
  console.log('ok', nombre)
}
