import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const sharedDist = join(pluginRoot, 'common', 'metadata-editor-runtime', 'dist')
const require = createRequire(import.meta.url)
const shared = require(join(sharedDist, 'index.js'))
const packagePath = join(pluginRoot, 'package.json')
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))
const registrations = shared.metadataEditorRegistrationDefinitions
const newFileCommands = shared.newMetadataFileCommandDefinitions
const typedNewFileCommandIds = new Set(newFileCommands.map((definition) => definition.command))

packageJson.activationEvents = [
  ...registrations.map((registration) => `onCustomEditor:${registration.viewType}`),
  ...newFileCommands.map((definition) => `onCommand:${definition.command}`),
  ...packageJson.activationEvents.filter((event) => {
    const text = String(event)
    return !text.startsWith('onCustomEditor:tidestack.metadataEditor.')
      && !typedNewFileCommandIds.has(text.replace(/^onCommand:/, ''))
  }),
]

packageJson.contributes.customEditors = registrations.map((registration) => ({
  viewType: registration.viewType,
  displayName: `%${registration.editorNameKey}%`,
  selector: registration.fileMatchPatterns.map((filenamePattern) => ({ filenamePattern })),
  priority: registration.priority,
}))

const activeCustomEditorWhen = registrations
  .map((registration) => `activeCustomEditorId == ${registration.viewType}`)
  .join(' || ')
const editorTitleMenu = packageJson.contributes.menus['editor/title'] ?? []
for (const item of editorTitleMenu) {
  if (item.command === 'tidestack.metadata.openSource') {
    item.when = activeCustomEditorWhen
  }
}

const typedCommandContributions = newFileCommands.map((definition) => ({
  command: definition.command,
  title: `%${metadataTypeCommandTitleKey(definition.metadataType)}%`,
}))
const commandsWithoutTypedMetadata = packageJson.contributes.commands.filter((command) => !typedNewFileCommandIds.has(command.command))
packageJson.contributes.commands = commandsWithoutTypedMetadata.flatMap((command) => (
  command.command === 'tidestack.metadata.newFile'
    ? [command, ...typedCommandContributions]
    : [command]
))

packageJson.contributes.menus['tidestack.metadata.newFileSubmenu'] = newFileCommands.map((definition, index) => ({
  command: definition.command,
  group: `types@${index + 1}`,
}))

writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`)

function metadataTypeCommandTitleKey(metadataType) {
  return `metadata.type.${metadataType}.command`
}
