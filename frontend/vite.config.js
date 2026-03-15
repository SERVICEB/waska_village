// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Autorise l'accès via l'IP locale
    hmr: {
      overlay: false, // Désactive l'alerte d'erreur plein écran dans le navigateur
    },
  },
})