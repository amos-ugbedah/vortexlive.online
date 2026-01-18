// scripts/version-injector.js
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const version = process.env.npm_package_version || '2.6.3'
const timestamp = Date.now()
const buildId = `build-${timestamp}`

console.log(`🔧 Injecting version ${version} (${buildId}) into build...`)

// Read the built index.html
const distPath = join(process.cwd(), 'dist')
const indexPath = join(distPath, 'index.html')

if (!statSync(distPath, { throwIfNoEntry: false })) {
  console.error('❌ dist folder not found. Run npm run build first.')
  process.exit(1)
}

let html = readFileSync(indexPath, 'utf8')

// Add version and timestamp to HTML
html = html.replace(
  '</head>',
  `<meta name="version" content="${version}">
  <meta name="build-id" content="${buildId}">
  <meta name="timestamp" content="${timestamp}">
  <script>
    window.APP_VERSION = "${version}";
    window.BUILD_ID = "${buildId}";
    window.BUILD_TIMESTAMP = ${timestamp};
    console.log('🚀 Vortex Live v${version} - ${buildId}');
  </script>
  </head>`
)

writeFileSync(indexPath, html, 'utf8')

// Also update service worker if exists
const swPath = join(distPath, 'service-worker.js')
if (statSync(swPath, { throwIfNoEntry: false })) {
  let swContent = readFileSync(swPath, 'utf8')
  swContent = swContent.replace(/const CACHE_NAME = '[^']*'/, `const CACHE_NAME = 'vortex-v${version}-${buildId}'`)
  writeFileSync(swPath, swContent, 'utf8')
}

console.log(`✅ Version ${version} injected successfully!`)
console.log(`📅 Build ID: ${buildId}`)
console.log(`⏰ Timestamp: ${new Date(timestamp).toISOString()}`)