import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)))

const required = [
  join(pluginRoot, 'common', 'metadata-editor-runtime', 'dist', 'index.js'),
  join(pluginRoot, 'common', 'metadata-editor-schema', 'dist', 'metadataTypeContributions.json'),
  join(pluginRoot, 'common', 'metadata-editor-schema', 'dist', 'metadataEditorRegistrations.json'),
  join(pluginRoot, 'common', 'metadata-editor-runtime', 'dist', 'browser', 'metadata-editor-host.js'),
  join(pluginRoot, 'common', 'metadata-editor-runtime', 'runtime', 'metadata-editor-runtime.js'),
  join(pluginRoot, 'common', 'metadata-editor-runtime', 'runtime', 'metadata-editor-webview.html'),
  join(pluginRoot, 'common', 'metadata-editor-runtime', 'runtime', 'metadata-editor-amis-editor.js'),
  join(pluginRoot, 'common', 'metadata-editor-runtime', 'runtime', 'metadata-editor-amis-editor.css'),
  join(pluginRoot, 'common', 'contracts', 'tidestack-develop-config.json'),
  join(pluginRoot, 'common', 'amis-sdk', 'sdk.js'),
  join(pluginRoot, 'common', 'amis-sdk', 'sdk.css'),
  join(pluginRoot, 'common', 'amis-sdk', 'cxd.css'),
  join(pluginRoot, 'common', 'amis-sdk', 'dark.css'),
]

const missing = required.filter((path) => !existsSync(path))
if (missing.length) {
  throw new Error(`Missing shared metadata editor assets:\n${missing.map((path) => `- ${path}`).join('\n')}`)
}
