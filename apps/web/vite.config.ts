import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Deliberately no server.fs.allow widening. The docs pages import
  // ../../docs/*.md?raw, which reads as though the dev server needed access
  // above its own root -- but Vite already resolves the npm workspace root,
  // and production builds don't consult fs.allow at all. Allowing the whole
  // repo bought nothing and let the dev server serve any file in it.

  // Served from the domain root. Switch to '/farsight/' if this ever moves to
  // GitHub Pages, which serves project sites from a subpath.
  base: '/',
})
