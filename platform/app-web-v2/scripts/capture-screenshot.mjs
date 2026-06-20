import { chromium } from 'playwright'
import { createServer } from 'vite'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const [,, routePath = '/app/digital-twin', outFile = 'test-results/visual/digital-twin-current.png'] = process.argv

const server = await createServer({ root, server: { port: 5175 } })
await server.listen()
console.log('Dev server started on port 5175')

const browser = await chromium.launch()
const page = await browser.newPage()
await page.setViewportSize({ width: 1920, height: 1080 })
await page.goto(`http://localhost:5175${routePath}`)
await page.waitForSelector('h1', { timeout: 10000 })
await page.waitForTimeout(800)
await page.screenshot({ path: resolve(root, outFile), fullPage: false })
console.log(`Screenshot saved → ${outFile}`)

await browser.close()
await server.close()
process.exit(0)
