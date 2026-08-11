import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const vsixPath = process.argv[2] || findSingleVsix(pluginRoot)
const assetManifest = JSON.parse(readFileSync(join(pluginRoot, 'dist', 'media', 'metadataEditorAssets.json'), 'utf8'))

const requiredEntries = [
  ...assetManifest.runtimeFiles.map((relativePath) => `extension/dist/media/${relativePath}`),
  ...assetManifest.schemaFiles.map((relativePath) => `extension/dist/media/${relativePath}`),
  ...assetManifest.amisSdkRequiredFiles.map((relativePath) => `extension/dist/media/amis-sdk/${relativePath}`),
  ...assetManifest.contractFiles.map((relativePath) => `extension/dist/contracts/${relativePath}`),
  'extension/dist/vendor/ouroboros-metadata-editor/browser/metadata-editor-host.js',
]

if (!existsSync(vsixPath)) {
  throw new Error(`Missing VSIX package: ${vsixPath}`)
}

const entries = new Set(listZipEntries(vsixPath))
const missing = requiredEntries.filter((entry) => !entries.has(entry))
if (missing.length) {
  throw new Error(`VSIX package is missing metadata editor assets:\n${missing.map((entry) => `- ${entry}`).join('\n')}`)
}

function findSingleVsix(root) {
  const files = readdirSync(root)
    .filter((file) => file.endsWith('.vsix'))
    .map((file) => join(root, file))
  if (files.length !== 1) {
    throw new Error(`Expected exactly one VSIX package in ${root}, found ${files.length}`)
  }
  return files[0]
}

function listZipEntries(path) {
  try {
    return execFileSync('unzip', ['-Z1', path], { encoding: 'utf8' })
      .split('\n')
      .filter(Boolean)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Unable to inspect VSIX package ${path}: ${message}`)
  }
}
