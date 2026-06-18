import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    cssMinify: true,
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          chart: ['chart.js'],
          sortable: ['sortablejs'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})
