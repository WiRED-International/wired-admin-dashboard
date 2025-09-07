import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/apiv2/',
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      //modules routes and packages routes are not prefixed with /api
      '/modules': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/packages': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/users': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/roles': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/organizations': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/countries': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/cities': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/specializations': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    }
  },
})
