import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Boton } from './Boton'
import { Campo } from './Campo'

const estado = vi.hoisted(() => ({ hayNueva: false, actualizar: vi.fn(), setHayNueva: vi.fn() }))

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [estado.hayNueva, estado.setHayNueva],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: estado.actualizar,
  }),
}))

import { AvisoActualizacion } from './AvisoActualizacion'

beforeEach(() => {
  estado.hayNueva = false
  estado.actualizar.mockClear()
})

describe('Boton', () => {
  it('llama onClick y se bloquea mientras carga', async () => {
    const alTocar = vi.fn()
    const { rerender } = render(<Boton onClick={alTocar}>Guardar</Boton>)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(alTocar).toHaveBeenCalledTimes(1)

    rerender(
      <Boton onClick={alTocar} cargando>
        Guardar
      </Boton>,
    )
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })
})

describe('Campo', () => {
  it('muestra y oculta la contraseña', async () => {
    render(<Campo etiqueta="Contraseña" type="password" />)
    const input = screen.getByLabelText('Contraseña')
    expect(input).toHaveAttribute('type', 'password')
    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(input).toHaveAttribute('type', 'text')
  })

  it('asocia el error con el campo', () => {
    render(<Campo etiqueta="Correo" error="Escribe un correo válido" />)
    expect(screen.getByLabelText('Correo')).toHaveAccessibleDescription('Escribe un correo válido')
  })
})

describe('AvisoActualizacion', () => {
  it('no muestra nada sin version nueva', () => {
    render(<AvisoActualizacion />)
    expect(screen.queryByText('Hay una versión nueva')).not.toBeInTheDocument()
  })

  it('ofrece actualizar cuando hay version nueva', async () => {
    estado.hayNueva = true
    render(<AvisoActualizacion />)
    expect(screen.getByText('Hay una versión nueva')).toBeInTheDocument()
    const waiting = { postMessage: vi.fn() }
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { addEventListener: vi.fn(), getRegistration: vi.fn().mockResolvedValue({ waiting }) },
    })
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
    expect(estado.actualizar).toHaveBeenCalledWith(true)
    expect(screen.getByRole('button', { name: /Actualizando/ })).toBeDisabled()
  })
})
