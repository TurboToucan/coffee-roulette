import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Base is set to '/' for custom domain hosting.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
})
