import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const outputRoot = join(pluginRoot, 'dist', 'media')
const amisSdkSource = join(pluginRoot, 'common', 'amis-sdk')
const sharedRoot = join(pluginRoot, 'common', 'amis-schema')
const contractRoot = join(pluginRoot, 'common', 'contracts')

const assets = [
  {
    source: join(sharedRoot, 'runtime', 'metadata-editor-runtime.js'),
    target: join(outputRoot, 'runtime', 'metadata-editor-runtime.js'),
  },
  {
    source: join(sharedRoot, 'runtime', 'metadata-editor-webview.html'),
    target: join(outputRoot, 'runtime', 'metadata-editor-webview.html'),
  },
  {
    source: join(sharedRoot, 'runtime', 'metadata-editor-amis-editor.js'),
    target: join(outputRoot, 'runtime', 'metadata-editor-amis-editor.js'),
  },
  {
    source: join(sharedRoot, 'runtime', 'metadata-editor-amis-editor.css'),
    target: join(outputRoot, 'runtime', 'metadata-editor-amis-editor.css'),
  },
  {
    source: join(sharedRoot, 'src', 'metadataTypeContributions.json'),
    target: join(outputRoot, 'metadataTypeContributions.json'),
  },
  {
    source: join(contractRoot, 'tidestack-develop-config.json'),
    target: join(pluginRoot, 'dist', 'contracts', 'tidestack-develop-config.json'),
  },
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
