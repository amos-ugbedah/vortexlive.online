import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Generate a unique build ID based on timestamp and git commit
const generateBuildId = () => {
  const timestamp = Date.now()
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '')
  const time = Math.floor(timestamp / 1000).toString(36)
  return `v${date}-${time}`
}

const buildId = generateBuildId()

export default defineConfig({
  plugins: [
    react(),
    // Add HTML injection for build info
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        return html.replace(
          '</head>',
          `<meta name="build-id" content="${buildId}">
          <meta name="deploy-time" content="${new Date().toISOString()}">
          <script>
            window.BUILD_ID = "${buildId}";
            window.DEPLOY_TIME = "${new Date().toISOString()}";
            console.log('🚀 Vortex Live - Build: ${buildId}');
          </script>
          </head>`
        )
      }
    }
  ],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    // Enhanced cache busting with build ID
    rollupOptions: {
      output: {
        entryFileNames: `assets/v-core-${buildId}-[hash].js`,
        chunkFileNames: `assets/v-chunk-${buildId}-[hash].js`,
        assetFileNames: `assets/v-asset-${buildId}-[hash].[ext]`,
        
        // Manual chunk optimization
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split vendor chunks
            if (id.includes('react')) return 'vendor-react'
            if (id.includes('firebase')) return 'vendor-firebase'
            if (id.includes('@supabase')) return 'vendor-supabase'
            return 'vendor-other'
          }
        }
      }
    },
    // Minification and optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Build reporting
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500
  },
  server: {
    port: 3000,
    host: true,
    open: true
  },
  preview: {
    port: 3001,
    host: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase', '@supabase/supabase-js'],
    exclude: ['livereload']
  }
})