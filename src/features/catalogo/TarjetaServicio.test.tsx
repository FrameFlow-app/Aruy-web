import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { PerfilPublico, Servicio } from '../../api/tipos'

vi.mock('../../api/endpoints', () => ({
  fotosServicio: vi.fn().mockResolvedValue([]),
}))

import { TarjetaServicio } from './TarjetaServicio'

const servicio: Servicio = {
  id: 'abc',
  prestador_id: 'p1',
  titulo: 'Reparación de tuberías',
  descripcion: 'Arreglo fugas',
  categoria: 'PLOMERIA',
  precio_referencial: 15,
  disponible: true,
}

const prestador: PerfilPublico = {
  id: 'p1',
  usuario_id: 'u1',
  nombre: 'Ana Pérez',
  telefono: '',
  foto_perfil: null,
  estado_verificacion: 'VERIFICADA',
  oficio_principal: 'Plomera',
  descripcion_profesional: null,
  zona_cobertura: 'Norte',
  anios_experiencia: 3,
  disponible: true,
  calificacion_promedio: 4.5,
  total_calificaciones: 8,
}

function mostrar(item: { servicio: Servicio; prestador: PerfilPublico | null }) {
  return render(
    <MemoryRouter>
      <TarjetaServicio item={item} />
    </MemoryRouter>,
  )
}

describe('TarjetaServicio', () => {
  it('enlaza al detalle y muestra título, prestador, precio y calificación', () => {
    mostrar({ servicio, prestador })
    expect(screen.getByRole('link')).toHaveAttribute('href', '/servicio/abc')
    expect(screen.getByRole('heading', { name: 'Reparación de tuberías' })).toBeInTheDocument()
    expect(screen.getByText('Ana Pérez, Norte')).toBeInTheDocument()
    expect(screen.getByText('Desde $15')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Calificación 4,5 de 5, 8 opiniones/ })).toBeInTheDocument()
    expect(screen.queryByText('No disponible')).not.toBeInTheDocument()
  })

  it('sin prestador ni precio: «Precio a convenir», «Nuevo en Aruy» y aviso si está pausado', () => {
    mostrar({ servicio: { ...servicio, precio_referencial: null, disponible: false }, prestador: null })
    expect(screen.getByText('Precio a convenir')).toBeInTheDocument()
    expect(screen.getByText('Nuevo en Aruy')).toBeInTheDocument()
    expect(screen.getByText('No disponible')).toBeInTheDocument()
  })
})
