import { useState } from 'react'
import './Avatar.css'

function iniciales(nombre: string): string {
  const letras = nombre
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return letras || '?'
}

function tono(nombre: string): number {
  let h = 0
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) | 0
  return Math.abs(h) % 5
}

interface Props {
  nombre: string
  fotoUrl?: string | null
  tamano?: number
}

/** Foto de perfil o iniciales sobre uno de 5 tonos (estable por nombre, como en Android). */
export function Avatar({ nombre, fotoUrl, tamano = 48 }: Props) {
  const [fallo, setFallo] = useState(false)
  const conFoto = !!fotoUrl && !fallo
  return (
    <span
      className="avatar"
      data-tono={tono(nombre)}
      role="img"
      aria-label={conFoto ? `Foto de perfil de ${nombre}` : nombre}
      style={{ width: tamano, height: tamano, fontSize: tamano * 0.38 }}
    >
      <span aria-hidden="true">{iniciales(nombre)}</span>
      {conFoto && <img src={fotoUrl} alt="" loading="lazy" onError={() => setFallo(true)} />}
    </span>
  )
}
