import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    // Aggressive cache busting
    rollupOptions: {
      output: {
        entryFileNames: `assets/v-core-[hash]-${Date.now()}.js`, 
        chunkFileNames: `assets/v-chunk-[hash].js`,
        assetFileNames: `assets/v-asset-[hash].[ext]`
      }
    }
  },
  server: {
    port: 3000,
    host: true
  }
})