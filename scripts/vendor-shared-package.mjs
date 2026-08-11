import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const sharedDist = join(pluginRoot, 'common', 'metadata-editor-runtime', 'dist')
const vendorRoot = join(pluginRoot, 'dist', 'vendor', 'ouroboros-metadata-editor')
const compiledFiles = listJavaScriptFiles(join(pluginRoot, 'dist'))

if (!existsSync(join(sharedDist, 'index.js'))) {
  throw new Error(`Missing built shared metadata editor package: ${sharedDist}`)
}

rmSync(vendorRoot, { recursive: true, force: true })
mkdirSync(vendorRoot, { recursive: true })
cpSync(sharedDist, vendorRoot, { recursive: true })
writeFileSync(
  join(vendorRoot, 'package.json'),
  `${JSON.stringify({ name: 'ouroboros-metadata-editor', main: './index.js' }, null, 2)}\n`,
)

for (const file of compiledFiles) {
  if (!existsSync(file)) {
    continue
  }
  const next = readFileSync(file, 'utf8')
    .replaceAll('require("ouroboros-metadata-editor")', 'require("./vendor/ouroboros-metadata-editor")')
    .replaceAll("require('ouroboros-metadata-editor')", "require('./vendor/ouroboros-metadata-editor')")
  writeFileSync(file, next)
}

function listJavaScriptFiles(root) {
  if (!existsSync(root)) {
    return []
  }
  return readdirSync(root).flatMap((name) => {
    const absolutePath = join(root, name)
    const stat = statSync(absolutePath)
    if (stat.isDirectory()) {
      return name === 'vendor' ? [] : listJavaScriptFiles(absolutePath)
    }
    return name.endsWith('.js') ? [absolutePath] : []
  })
}
