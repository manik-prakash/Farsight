import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../..')

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // The docs pages render the repo's real Markdown via `?raw` imports, so the
  // dev server has to be allowed to read above its own root. Production
  // builds inline the content at bundle time and don't need this.
  server: { fs: { allow: [repoRoot] } },

  // Served from the domain root. Switch to '/farsight/' if this ever moves to
  // GitHub Pages, which serves project sites from a subpath.
  base: '/',
})
