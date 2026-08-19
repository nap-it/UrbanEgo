import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` is relative so the built site works from any GitHub Pages subpath
// (e.g. https://user.github.io/repo/) as well as locally, without rebuilding.
// Override with VITE_BASE=/repo/ if an absolute base is ever needed.
export default defineConfig({
  base: process.env.VITE_BASE || './',
  plugins: [react()],
})
