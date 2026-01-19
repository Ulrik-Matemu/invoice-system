import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    injectRegister: null,
    registerType: 'autoUpdate', devOptions: { enabled: true },
    manifest: {
      name: 'myInvo: Smart Invoicing',
      short_name: 'myInvo',
      start_url: '/',
      display: 'standalone',
      theme_color: '#020e1bff',
      background_color: '#0f172a',
      icons: [
        {
          src: '/icons/192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/icons/512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: 'icons/144x144.png',
          sizes: '144x144',
          type: 'image/png',
        }
      ],
    },
  })],
})
