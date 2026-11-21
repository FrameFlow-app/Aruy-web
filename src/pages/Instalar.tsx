import type { ReactNode } from 'react'
import { IconoCompartir, IconoMas } from '../components/Iconos'
import { Logo } from '../components/Logo'
import { Tarjeta } from '../components/Tarjeta'
import { Pantalla } from './Pantalla'
import './Instalar.css'

function Paso({ n, titulo, texto, dibujo }: { n: number; titulo: string; texto: string; dibujo: ReactNode }) {
  return (
    <li className="paso">
      <Tarjeta>
        <div className="paso__cabecera">
          <span className="paso__numero" aria-hidden="true">
            {n}
          </span>
          <div>
            <h2>{titulo}</h2>
            <p className="texto-suave">{texto}</p>
          </div>
        </div>
        <div className="paso__dibujo" aria-hidden="true">
          {dibujo}
        </div>
      </Tarjeta>
    </li>
  )
}

export function Instalar() {
  return (
    <Pantalla titulo="Instala Aruy en tu iPhone" atras volverA="/">
      <p className="texto-suave">
        Así Aruy se abre como cualquier app, a pantalla completa y sin barra del navegador. Toma menos de un minuto.
      </p>
      <ol className="pasos">
        <Paso
          n={1}
          titulo="Ábrelo en Safari"
          texto="Tiene que ser Safari, el navegador azul con la brújula. Desde otros navegadores no aparece la opción."
          dibujo={
            <div className="maqueta maqueta--url">
              <span className="maqueta__candado" />
              <span>frameflow-app.github.io</span>
            </div>
          }
        />
        <Paso
          n={2}
          titulo="Toca Compartir"
          texto="Es el cuadro con una flecha hacia arriba, abajo en el centro de la pantalla."
          dibujo={
            <div className="maqueta maqueta--barra">
              <span className="maqueta__tenue">‹</span>
              <span className="maqueta__tenue">›</span>
              <span className="maqueta__resaltado">
                <IconoCompartir />
              </span>
              <span className="maqueta__tenue">▢</span>
              <span className="maqueta__tenue">⋯</span>
            </div>
          }
        />
        <Paso
          n={3}
          titulo="Elige «Añadir a pantalla de inicio»"
          texto="Desliza la lista hacia arriba si no la ves. Después toca «Añadir» arriba a la derecha."
          dibujo={
            <div className="maqueta maqueta--lista">
              <div className="maqueta__fila maqueta__fila--tenue">Copiar</div>
              <div className="maqueta__fila maqueta__fila--marcada">
                <span>Añadir a pantalla de inicio</span>
                <IconoMas />
              </div>
              <div className="maqueta__fila maqueta__fila--tenue">Marcador</div>
            </div>
          }
        />
        <Paso
          n={4}
          titulo="Abre Aruy desde tu pantalla de inicio"
          texto="Busca el ícono azul con la «A» y la costura amarilla. Desde ahí se abre como una app más."
          dibujo={
            <div className="maqueta maqueta--icono">
              <Logo tamano={64} />
              <span>Aruy</span>
            </div>
          }
        />
      </ol>
      <Tarjeta tipo="acento">
        <h3>¿No te aparece la opción?</h3>
        <p>Revisa que estés en Safari y no dentro de otra app, como Instagram o WhatsApp. Si es así, copia el enlace y pégalo en Safari.</p>
      </Tarjeta>
    </Pantalla>
  )
}
