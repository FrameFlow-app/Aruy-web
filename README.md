# Aruy Web

Versión web instalable (PWA) de Aruy, pensada para iPhone. Usa el mismo backend que la app Android (`https://aruy-api.onrender.com`).
Se publica en https://frameflow-app.github.io/Aruy-web/

Stack: React + Vite + TypeScript (strict), React Router (HashRouter), `vite-plugin-pwa`, Vitest.

## Cómo correrlo

```bash
npm install
cp .env.example .env   # opcional: el valor por defecto ya apunta a producción
npm run dev            # http://localhost:5173
```

| Script            | Qué hace                                               |
| ----------------- | ------------------------------------------------------ |
| `npm run dev`     | Servidor de desarrollo en el puerto 5173 (base `/`)    |
| `npm run build`   | `tsc -b` + build de producción (base `/Aruy-web/`)     |
| `npm run preview` | Sirve `dist/` para probar el build y el service worker |
| `npm run lint`    | ESLint                                                 |
| `npm test`        | Vitest (una sola corrida)                              |
| `npm run iconos`  | Regenera los PNG de `public/icons` desde el logo       |

## Variables de entorno

| Variable       | Por defecto                      | Uso                           |
| -------------- | -------------------------------- | ----------------------------- |
| `VITE_API_URL` | `https://aruy-api.onrender.com`  | Dirección del backend de Aruy |

No hay claves secretas en el frontend. El backend permite CORS solo para `https://frameflow-app.github.io` y `http://localhost:5173`.

## Estructura

- `src/api/`: cliente (`api.ts`), sesión y renovación de token (`sesion.ts`), contexto (`SesionContexto.tsx`), endpoints y tipos.
- `src/components/`: Boton, Tarjeta, Chip, Campo, HojaInferior, Aviso, Avatar, BarraInferior, Cargando, EstadoVacio, Encabezado, Logo, AvisoActualizacion.
- `src/styles/tokens.css`: colores, radios y tipografía tomados del tema Android, con modo claro y oscuro.
- `public/fonts/`: Bricolage Grotesque y Atkinson Hyperlegible (las mismas de la app, sin depender de Google Fonts).

## Sesión

No hay refresh token. El JWT dura 30 días; al abrir la app, si tiene más de un día de emitido, se renueva con `POST /auth/renovar`.
Un 401 en cualquier petición cierra la sesión y lleva a Ingresar.

## Despliegue

`.github/workflows/deploy.yml` corre lint, tests y build en cada push y pull request. Al hacer push a `main` publica `dist/` en GitHub Pages.
Requisito único: en el repositorio, Settings > Pages > Source = **GitHub Actions**.

## Nota para Windows

Si la carpeta del proyecto tiene un `&` en la ruta (por ejemplo `Emprend_&_Movil`), los scripts de npm fallan porque `cmd.exe` interpreta el `&`.
Ejecuta las herramientas con node, por ejemplo `node node_modules/vitest/vitest.mjs run`, o mueve el proyecto a una ruta sin `&`.
