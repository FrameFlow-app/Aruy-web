/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// En desarrollo se sirve en la raiz (localhost:5173); en produccion vive en /Aruy-web/ (GitHub Pages).
export default defineConfig(({ command }) => {
  const base = command === 'build' ? '/Aruy-web/' : '/'
  return {
    base,
    server: { port: 5173, strictPort: true },
    preview: { port: 4173 },
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['logo.svg', 'icons/apple-touch-icon-180.png'],
        manifest: {
          name: 'Aruy',
          short_name: 'Aruy',
          description: 'Ofrece tu trabajo. Encuentra tu cliente.',
          lang: 'es',
          display: 'standalone',
          orientation: 'portrait',
          theme_color: '#2B3990',
          background_color: '#2B3990',
          start_url: base,
          scope: base,
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ttf,webmanifest}'],
          navigateFallback: `${base}index.html`,
          // La API nunca se guarda: lleva tokens y datos de cada persona.
          runtimeCaching: [
            { urlPattern: /^https:\/\/aruy-api\.onrender\.com\/.*/i, handler: 'NetworkOnly' },
          ],
        },
      }),
    ],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  }
})
