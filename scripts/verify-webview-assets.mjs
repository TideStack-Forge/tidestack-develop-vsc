import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const mediaRoot = join(pluginRoot, 'dist', 'media')
const assetManifestPath = join(mediaRoot, 'metadataEditorAssets.json')
const assetManifest = JSON.parse(readFileSync(assetManifestPath, 'utf8'))
const required = [
  ...assetManifest.runtimeFiles.map((relativePath) => join(mediaRoot, relativePath)),
  ...assetManifest.schemaFiles.map((relativePath) => join(mediaRoot, relativePath)),
  ...assetManifest.amisSdkRequiredFiles.map((relativePath) => join(mediaRoot, 'amis-sdk', relativePath)),
  ...assetManifest.contractFiles.map((relativePath) => join(pluginRoot, 'dist', 'contracts', relativePath)),
  join(pluginRoot, 'dist', 'vendor', 'ouroboros-metadata-editor', 'index.js'),
]

for (const cssName of assetManifest.amisSdkCssFilesWithReferencedAssets) {
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

const unresolvedSharedPackageFiles = listJavaScriptFiles(join(pluginRoot, 'dist'))
  .filter((filePath) => readFileSync(filePath, 'utf8').includes('require("ouroboros-metadata-editor")'))
if (unresolvedSharedPackageFiles.length) {
  throw new Error(`VS Code extension host still requires the monorepo shared package instead of dist/vendor:\n${unresolvedSharedPackageFiles.map((filePath) => `- ${filePath}`).join('\n')}`)
}

const missing = [...new Set(required)].filter((path) => !existsSync(path))
if (missing.length) {
  throw new Error(`VS Code metadata webview package is missing assets:\n${missing.map((path) => `- ${path}`).join('\n')}`)
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
