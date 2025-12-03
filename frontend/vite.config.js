import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: ['quickmail.janakkumarshrestha0.com.np', 'localhost', '127.0.0.1', '0.0.0.0'],
  },
})
