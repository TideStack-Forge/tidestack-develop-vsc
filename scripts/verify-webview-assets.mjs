import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const mediaRoot = join(pluginRoot, 'dist', 'media')
const required = [
  join(mediaRoot, 'runtime', 'metadata-editor-runtime.js'),
  join(mediaRoot, 'runtime', 'metadata-editor-webview.html'),
  join(mediaRoot, 'runtime', 'metadata-editor-amis-editor.js'),
  join(mediaRoot, 'runtime', 'metadata-editor-amis-editor.css'),
  join(mediaRoot, 'metadataTypeContributions.json'),
  join(mediaRoot, 'amis-sdk', 'sdk.js'),
  join(mediaRoot, 'amis-sdk', 'sdk.css'),
  join(mediaRoot, 'amis-sdk', 'cxd.css'),
  join(mediaRoot, 'amis-sdk', 'dark.css'),
  join(pluginRoot, 'dist', 'contracts', 'tidestack-develop-config.json'),
  join(pluginRoot, 'dist', 'vendor', 'ouroboros-metadata-editor', 'index.js'),
]

for (const cssName of ['sdk.css', 'cxd.css', 'dark.css']) {
  const cssPath = join(mediaRoot, 'amis-sdk', cssName)
  if (!existsSync(cssPath)) {
    continue
  }
  const css = readFileSync(cssPath, 'utf8')
  for (const match of css.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    const assetPath = match[1]
    if (!assetPath.startsWith('data:') && !assetPath.startsWith('http:') && !assetPath.startsWith('https:')) {
      required.push(join(mediaRoot, 'amis-sdk', assetPath))
    }
  }
}

const extensionHost = join(pluginRoot, 'dist', 'metadataCustomEditor.js')
if (existsSync(extensionHost) && readFileSync(extensionHost, 'utf8').includes('require("ouroboros-metadata-editor")')) {
  throw new Error('VS Code extension host still requires the monorepo shared package instead of dist/vendor')
}

const missing = [...new Set(required)].filter((path) => !existsSync(path))
if (missing.length) {
  throw new Error(`VS Code metadata webview package is missing assets:\n${missing.map((path) => `- ${path}`).join('\n')}`)
}
