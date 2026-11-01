import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://kirishoru.github.io',
  trailingSlash: 'ignore',
  vite: { plugins: [tailwindcss()] },
})
