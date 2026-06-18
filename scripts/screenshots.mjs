import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.BASE_URL || 'http://localhost:4173'
const outputDir = path.resolve('docs/screenshots')

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
]

const surfaces = [
  { name: 'dashboard', route: '#/' },
  { name: 'projects', route: '#/projects' },
  { name: 'tasks', route: '#/tasks' },
  { name: 'team', route: '#/team' },
  { name: 'settings', route: '#/settings' },
]

await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch()

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
    })
    const page = await context.newPage()

    await page.goto(`${baseUrl}/#/login`, { waitUntil: 'networkidle' })
    await page.locator('.auth-card').waitFor()
    await page.screenshot({
      path: path.join(outputDir, `login-${viewport.name}.png`),
      fullPage: true,
      animations: 'disabled',
    })

    await page.getByLabel('Email').fill('demo@flowboard.app')
    await page.getByLabel('Password').fill('demo1234')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.waitForURL('**/#/')
    await page.locator('.app-shell').waitFor()
    await page.locator('.toast').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {})

    for (const surface of surfaces) {
      await page.goto(`${baseUrl}/${surface.route}`, { waitUntil: 'networkidle' })
      await page.locator('.app-shell').waitFor()
      await page.screenshot({
        path: path.join(outputDir, `${surface.name}-${viewport.name}.png`),
        fullPage: true,
        animations: 'disabled',
      })
    }

    await context.close()
  }
} finally {
  await browser.close()
}
