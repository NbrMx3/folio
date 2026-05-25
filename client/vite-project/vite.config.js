import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  publicDir: 'src/public',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['dk_portfolio_logo_light.svg'],
      manifest: {
        name: 'CyberDev Portfolio',
        short_name: 'Portfolio',
        description: 'CyberDev Full-Stack Developer Portfolio',
        theme_color: '#22223b',
        background_color: '#22223b',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/dk_portfolio_logo_light.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/dk_portfolio_logo_light.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
    headers: {
      // Allow Chrome DevTools to probe localhost:5000 and the Render backend without CSP errors
      'Content-Security-Policy':
        "default-src 'self'; connect-src 'self' http://localhost:5000 https://*.onrender.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: http://localhost:5000 https://res.cloudinary.com https://*.onrender.com; font-src 'self' data: https://fonts.gstatic.com; worker-src 'self' blob:",
    },
  },
})
