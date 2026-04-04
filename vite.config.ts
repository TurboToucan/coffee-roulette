import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Base is set to '/coffee-roulette/' for GitHub Pages deployment.
// Change to '/' if hosting at a root domain.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/coffee-roulette/',
})
