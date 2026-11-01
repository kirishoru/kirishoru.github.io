import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

// User site (kirishoru.github.io) is served from the domain root, so base is '/'.
export default defineConfig({
  base: '/',
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        prioritize: resolve(import.meta.dirname, 'prioritize/index.html'),
        bodycomp: resolve(import.meta.dirname, 'bodycomp/index.html'),
      },
    },
  },
})
