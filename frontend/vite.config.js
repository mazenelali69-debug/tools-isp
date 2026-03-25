import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

console.log("🔥 VITE CONFIG LOADED 🔥")

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5177,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:9090',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://127.0.0.1:9090',
        changeOrigin: true,
        ws: true
      }
    }
  }
})

