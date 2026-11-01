import { defineConfig } from 'vite'
import { resolve } from 'node:path'

// User site (kirishoru.github.io) is served from the domain root, so base is '/'.
export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        prioritize: resolve(__dirname, 'prioritize/index.html'),
        bodycomp: resolve(__dirname, 'bodycomp/index.html'),
      },
    },
  },
})
