import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const outputRoot = join(pluginRoot, 'dist', 'media')
const amisSdkSource = join(pluginRoot, 'common', 'amis-sdk')
const runtimeRoot = join(pluginRoot, 'common', 'metadata-editor-runtime')
const schemaDistRoot = join(pluginRoot, 'common', 'metadata-editor-schema', 'dist')
const contractRoot = join(pluginRoot, 'common', 'contracts')
const assetManifest = JSON.parse(readFileSync(join(schemaDistRoot, 'metadataEditorAssets.json'), 'utf8'))

const assets = [
  ...assetManifest.runtimeFiles.map((relativePath) => ({
    source: join(runtimeRoot, relativePath),
    target: join(outputRoot, relativePath),
  })),
  ...assetManifest.schemaFiles.map((relativePath) => ({
    source: join(schemaDistRoot, relativePath),
    target: join(outputRoot, relativePath),
  })),
  ...assetManifest.contractFiles.map((fileName) => ({
    source: join(contractRoot, fileName),
    target: join(pluginRoot, 'dist', 'contracts', fileName),
  })),
]

const missing = assets.filter((asset) => !existsSync(asset.source))
if (!existsSync(amisSdkSource)) {
  missing.push({ source: amisSdkSource })
}
if (missing.length) {
  throw new Error(`Missing VS Code metadata webview assets:\n${missing.map((asset) => `- ${asset.source}`).join('\n')}`)
}

rmSync(outputRoot, { recursive: true, force: true })
for (const asset of assets) {
  mkdirSync(dirname(asset.target), { recursive: true })
  cpSync(asset.source, asset.target)
}
cpSync(amisSdkSource, join(outputRoot, 'amis-sdk'), { recursive: true })
