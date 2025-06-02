import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Custom startup message will be handled by package.json script
  },
  // Reduce build output verbosity
  logLevel: 'warn',
  clearScreen: false
})
