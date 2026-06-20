// Node.js CJS script — runs inside playwright docker container
const { chromium } = require('playwright')
const http = require('http')
const fs = require('fs')
const path = require('path')

const PORT = 5174
const DIST = '/tmp/dist'
const OUT = path.join(__dirname, '..', 'test-results', 'visual', 'digital-twin-current.png')

function serveStatic(req, res) {
  let filePath = path.join(DIST, req.url === '/' || req.url.startsWith('/app') ? '/index.html' : req.url)
  if (!fs.existsSync(filePath)) filePath = path.join(DIST, 'index.html')
  const ext = path.extname(filePath)
  const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' }
  res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' })
  fs.createReadStream(filePath).pipe(res)
}

async function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  const server = http.createServer(serveStatic)
  await new Promise(r => server.listen(PORT, r))
  console.log(`Server on ${PORT}`)

  const browser = await chromium.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto(`http://localhost:${PORT}/app/digital-twin`)
  await page.waitForFunction(() => document.querySelector('h1') !== null, { timeout: 10000 })
  await new Promise(r => setTimeout(r, 1200))
  await page.screenshot({ path: OUT })
  console.log('Screenshot saved →', OUT)

  await browser.close()
  server.close()
}

main().catch(e => { console.error(e); process.exit(1) })
