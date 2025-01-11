import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  server: {
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true
    }
  }
})
