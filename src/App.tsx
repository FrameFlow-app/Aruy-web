import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { SesionProvider } from './api/SesionContexto'
import { AvisoActualizacion } from './components/AvisoActualizacion'
import { DialogoMantenimiento } from './components/DialogoMantenimiento'
import { Bienvenida } from './pages/Bienvenida'
import { Buscar } from './pages/catalogo/Buscar'
import { DetalleServicio } from './pages/catalogo/DetalleServicio'
import { Inicio } from './pages/catalogo/Inicio'
import { PerfilPrestador } from './pages/catalogo/PerfilPrestador'
import { Ingresar } from './pages/cuenta/Ingresar'
import { Olvide } from './pages/cuenta/Olvide'
import { Registro } from './pages/cuenta/Registro'
import { Instalar } from './pages/Instalar'

// HashRouter: GitHub Pages no sabe reescribir rutas, y asi tampoco hace falta un 404 especial.
export default function App() {
  return (
    <HashRouter>
      <SesionProvider>
        <AvisoActualizacion />
        <DialogoMantenimiento />
        <Routes>
          <Route path="/" element={<Bienvenida />} />
          <Route path="/inicio" element={<Inicio />} />
          <Route path="/buscar" element={<Buscar />} />
          <Route path="/servicio/:id" element={<DetalleServicio />} />
          <Route path="/prestador/:id" element={<PerfilPrestador />} />
          <Route path="/ingresar" element={<Ingresar />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/olvide" element={<Olvide />} />
          <Route path="/instalar" element={<Instalar />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SesionProvider>
    </HashRouter>
  )
}
