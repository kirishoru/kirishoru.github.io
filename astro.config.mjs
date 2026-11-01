import { defineConfig } from 'astro/config'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  site: 'https://kirishoru.com',
  trailingSlash: 'ignore',
  vite: { plugins: [tailwindcss()] },
})
