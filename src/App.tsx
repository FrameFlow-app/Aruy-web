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
import { Chat } from './pages/solicitudes/Chat'
import { MisSolicitudes } from './pages/solicitudes/MisSolicitudes'
import { RutaPrivada } from './features/micuenta/RutaPrivada'
import { Ajustes } from './pages/micuenta/Ajustes'
import { EditarPerfil } from './pages/micuenta/EditarPerfil'
import { MiCuenta } from './pages/micuenta/MiCuenta'
import { Permisos } from './pages/micuenta/Permisos'
import { RutaSoloContratante, RutaSoloPrestador } from './features/prestador/RutasPorRol'
import { AruyPro } from './pages/prestador/AruyPro'
import { Ofrecer } from './pages/prestador/Ofrecer'
import { Panel } from './pages/prestador/Panel'
import { EditorServicio } from './pages/prestador-servicios/EditorServicio'
import { MisServicios } from './pages/prestador-servicios/MisServicios'
import { Portafolio } from './pages/prestador-servicios/Portafolio'

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
          <Route path="/solicitudes" element={<MisSolicitudes />} />
          <Route path="/solicitudes/:id" element={<Chat />} />
          <Route element={<RutaPrivada />}>
            <Route path="/cuenta" element={<MiCuenta />} />
            <Route path="/cuenta/editar" element={<EditarPerfil />} />
            <Route path="/cuenta/ajustes" element={<Ajustes />} />
            <Route path="/cuenta/permisos" element={<Permisos />} />
          </Route>
          <Route element={<RutaSoloPrestador />}>
            <Route path="/panel" element={<Panel />} />
            <Route path="/pro" element={<AruyPro />} />
            <Route path="/servicios" element={<MisServicios />} />
            <Route path="/servicios/nuevo" element={<EditorServicio />} />
            <Route path="/servicios/:id/editar" element={<EditorServicio />} />
            <Route path="/portafolio" element={<Portafolio />} />
          </Route>
          <Route element={<RutaSoloContratante />}>
            <Route path="/ofrecer" element={<Ofrecer />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SesionProvider>
    </HashRouter>
  )
}
