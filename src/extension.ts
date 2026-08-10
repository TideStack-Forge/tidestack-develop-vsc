import * as vscode from 'vscode'
import {
  createMetadataFileTemplateDefaultValues,
  getContributionByType,
  mapMetadataPackagedResourcePath,
  mapMetadataSourcePath,
  metadataTypeContributions,
  serializeMetadataFileTemplate,
  type MetadataFileTemplateField,
  type MetadataFileTemplateValues,
  type MetadataTypeContribution,
} from 'ouroboros-metadata-editor'
import { MetadataCustomEditorProvider, type MetadataCustomEditorRegistration } from './metadataCustomEditor'

const developConfigContractRelativePath = 'dist/contracts/tidestack-develop-config.json'
const metadataSourceRoot = 'src/main/metadata'

const metadataEditorRegistrations: MetadataCustomEditorRegistration[] = [
  { viewType: 'tidestack.metadataEditor.authority', metadataType: 'authority' },
  { viewType: 'tidestack.metadataEditor.menu', metadataType: 'menu' },
  { viewType: 'tidestack.metadataEditor.devMenu', metadataType: 'dev-menu' },
  { viewType: 'tidestack.metadataEditor.uiModel', metadataType: 'ui-model' },
  { viewType: 'tidestack.metadataEditor.uiSchema', metadataType: 'ui-schema' },
  { viewType: 'tidestack.metadataEditor.appModule', metadataType: 'app-module' },
  { viewType: 'tidestack.metadataEditor.configuration', metadataType: 'configuration' },
  { viewType: 'tidestack.metadataEditor.configurationGroup', metadataType: 'configuration-group' },
]

const newMetadataFileCommands: Array<{ command: string; metadataType: string }> = [
  { command: 'tidestack.metadata.newAuthorityFile', metadataType: 'authority' },
  { command: 'tidestack.metadata.newMenuFile', metadataType: 'menu' },
  { command: 'tidestack.metadata.newDevMenuFile', metadataType: 'dev-menu' },
  { command: 'tidestack.metadata.newUiModelFile', metadataType: 'ui-model' },
  { command: 'tidestack.metadata.newUiSchemaFile', metadataType: 'ui-schema' },
  { command: 'tidestack.metadata.newAppModuleFile', metadataType: 'app-module' },
  { command: 'tidestack.metadata.newConfigurationFile', metadataType: 'configuration' },
  { command: 'tidestack.metadata.newConfigurationGroupFile', metadataType: 'configuration-group' },
]

type JsonObject = Record<string, unknown>

type ConfigSectionContract = {
  path: string
  fields: string[]
  legacyAliases: Record<string, string[]>
  removedFields?: string[]
}

type TideStackDevelopConfigContract = {
  schemaVersion: number
  project: ConfigSectionContract
  local: ConfigSectionContract
}

type ProjectConfig = {
  schemaVersion: number
  developmentServerUrl: string
  appName: string
}

type LocalConfig = {
  schemaVersion: number
  devKey: string
}

let developConfigContract: TideStackDevelopConfigContract | undefined
let developConfigContractPromise: Promise<TideStackDevelopConfigContract> | undefined

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    ...metadataEditorRegistrations.map((registration) => MetadataCustomEditorProvider.register(context, registration)),
    vscode.commands.registerCommand(
      'tidestack.develop.openConfig',
      () => withDevelopConfigContract(context, openTideStackDevelopConfigFiles),
    ),
    vscode.commands.registerCommand(
      'tidestack.develop.configure',
      () => withDevelopConfigContract(context, configureTideStackDevelop),
    ),
    vscode.commands.registerCommand('tidestack.metadata.openSource', openMetadataSourceEditor),
    vscode.commands.registerCommand('tidestack.metadata.openVisual', openMetadataVisualEditor),
    vscode.commands.registerCommand('tidestack.metadata.newFile', createMetadataFile),
    ...newMetadataFileCommands.map(({ command, metadataType }) => vscode.commands.registerCommand(
      command,
      (uri?: vscode.Uri) => createMetadataFile(uri, metadataType),
    )),
  )
}

export function deactivate(): void {}

async function openMetadataSourceEditor(uri?: vscode.Uri): Promise<void> {
  const targetUri = normalizeCommandUri(uri) ?? MetadataCustomEditorProvider.getActiveResource()
  if (!targetUri) {
    await vscode.window.showWarningMessage('Open a TideStack metadata visual editor before switching to source.')
    return
  }

  try {
    await MetadataCustomEditorProvider.flushPendingChanges(targetUri)
  } catch (error) {
    await vscode.window.showErrorMessage(error instanceof Error ? error.message : String(error))
    return
  }

  await vscode.commands.executeCommand('vscode.openWith', targetUri, 'default', {
    preview: false,
    viewColumn: MetadataCustomEditorProvider.getActiveViewColumn(targetUri) ?? vscode.ViewColumn.Active,
  })
}

async function openMetadataVisualEditor(uri?: vscode.Uri): Promise<void> {
  const targetUri = normalizeCommandUri(uri) ?? vscode.window.activeTextEditor?.document.uri
  if (!targetUri) {
    await vscode.window.showWarningMessage('Open a TideStack metadata JSON file before switching to the visual editor.')
    return
  }

  const registration = resolveMetadataEditorRegistration(targetUri)
  if (!registration) {
    await vscode.window.showWarningMessage('The current JSON file is not a supported TideStack metadata file.')
    return
  }

  await vscode.commands.executeCommand('vscode.openWith', targetUri, registration.viewType, {
    preview: false,
    viewColumn: vscode.ViewColumn.Active,
  })
}

async function createMetadataFile(uri?: vscode.Uri, metadataType?: string): Promise<void> {
  const selectedUri = normalizeCommandUri(uri)
  const workspaceFolder = await selectWorkspaceFolderForUri(selectedUri)
  if (!workspaceFolder) {
    return
  }

  const contribution = metadataType ? getContributionByType(metadataType) : await selectMetadataContribution()
  if (!contribution) {
    if (metadataType) {
      await vscode.window.showErrorMessage(`Unsupported TideStack metadata type: ${metadataType}`)
    }
    return
  }

  const targetPath = await promptForMetadataPath(workspaceFolder, selectedUri, contribution)
  if (!targetPath) {
    return
  }

  const templateValues = await promptForTemplateValues(contribution, targetPath)
  if (!templateValues) {
    return
  }

  const targetUri = vscode.Uri.joinPath(workspaceFolder.uri, ...targetPath.split('/'))
  if (await fileExists(targetUri)) {
    await vscode.window.showErrorMessage(`TideStack metadata file already exists: ${targetPath}`)
    return
  }

  const targetParts = targetPath.split('/')
  await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(workspaceFolder.uri, ...targetParts.slice(0, -1)))
  await vscode.workspace.fs.writeFile(targetUri, Buffer.from(serializeMetadataFileTemplate(contribution, templateValues), 'utf8'))

  const registration = metadataEditorRegistrations.find((candidate) => candidate.metadataType === contribution.type)
  await vscode.commands.executeCommand('vscode.openWith', targetUri, registration?.viewType ?? 'default', {
    preview: false,
    viewColumn: vscode.ViewColumn.Active,
  })
}

function resolveMetadataEditorRegistration(uri: vscode.Uri): MetadataCustomEditorRegistration | undefined {
  const metadataPath = uri.toString()
  const mapping = mapMetadataPackagedResourcePath(metadataPath) ?? mapMetadataSourcePath(metadataPath)
  if (!mapping) {
    return undefined
  }
  return metadataEditorRegistrations.find((registration) => registration.metadataType === mapping.type)
}

function normalizeCommandUri(value: unknown): vscode.Uri | undefined {
  return value instanceof vscode.Uri ? value : undefined
}

async function selectWorkspaceFolderForUri(uri?: vscode.Uri): Promise<vscode.WorkspaceFolder | undefined> {
  if (uri) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri)
    if (workspaceFolder) {
      return workspaceFolder
    }
  }
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders || workspaceFolders.length === 0) {
    await vscode.window.showErrorMessage('Open a workspace before creating TideStack metadata files.')
    return undefined
  }
  if (workspaceFolders.length === 1) {
    return workspaceFolders[0]
  }
  const selected = await vscode.window.showQuickPick(
    workspaceFolders.map((folder) => ({ label: folder.name, description: folder.uri.fsPath, folder })),
    { placeHolder: 'Select the workspace for the new TideStack metadata file' },
  )
  return selected?.folder
}

async function selectMetadataContribution(): Promise<MetadataTypeContribution | undefined> {
  const selected = await vscode.window.showQuickPick(
    metadataTypeContributions
      .filter((contribution) => contribution.fileTemplate)
      .map((contribution) => ({
        label: contribution.displayName,
        description: contribution.fileTemplate?.defaultFileName,
        contribution,
      })),
    { placeHolder: 'Select TideStack metadata file type' },
  )
  return selected?.contribution
}

async function promptForMetadataPath(
  workspaceFolder: vscode.WorkspaceFolder,
  selectedUri: vscode.Uri | undefined,
  contribution: MetadataTypeContribution,
): Promise<string | undefined> {
  const selectedDirectory = await selectedRelativeDirectory(workspaceFolder, selectedUri)
  const defaultPath = defaultMetadataPath(selectedDirectory, contribution)
  const value = await vscode.window.showInputBox({
    prompt: `New ${contribution.displayName} file path`,
    value: defaultPath,
    ignoreFocusOut: true,
    validateInput: (input) => normalizeMetadataTemplatePath(input, contribution, selectedDirectory).error,
  })
  return value === undefined ? undefined : normalizeMetadataTemplatePath(value, contribution, selectedDirectory).path
}

function defaultMetadataPath(
  selectedDirectory: string | undefined,
  contribution: MetadataTypeContribution,
): string {
  if (contribution.fixedFileName) {
    return `${metadataSourceRoot}/${contribution.fixedFileName}`
  }
  const defaultFileName = contribution.fileTemplate?.defaultFileName ?? contribution.fixedFileName ?? 'metadata.json'
  if (selectedDirectory) {
    return `${selectedDirectory}/${defaultFileName}`
  }
  return `${metadataSourceRoot}/${defaultFileName}`
}

async function selectedRelativeDirectory(
  workspaceFolder: vscode.WorkspaceFolder,
  uri: vscode.Uri | undefined,
): Promise<string | undefined> {
  if (!uri) {
    return undefined
  }
  const stat = await vscode.workspace.fs.stat(uri).then((value) => value, () => undefined)
  const relativePath = normalizePath(vscode.workspace.asRelativePath(uri, false))
  const workspaceNamePrefix = `${workspaceFolder.name}/`
  const pathInWorkspace = relativePath.startsWith(workspaceNamePrefix)
    ? relativePath.slice(workspaceNamePrefix.length)
    : relativePath
  if (stat?.type === vscode.FileType.Directory) {
    return trimSlashes(pathInWorkspace)
  }
  return dirname(pathInWorkspace)
}

function normalizeMetadataTemplatePath(
  input: string,
  contribution: MetadataTypeContribution,
  selectedDirectory?: string,
): { path?: string; error?: string } {
  const normalizedInput = normalizePath(input.trim()).replace(/^\.\//, '')
  const directoryInput = normalizedInput.endsWith('/')
  const trimmed = trimSlashes(normalizedInput)
  if (!trimmed) {
    return { error: 'Enter a metadata file path.' }
  }

  const defaultFileName = contribution.fileTemplate?.defaultFileName ?? contribution.fixedFileName
  if (contribution.fixedFileName) {
    const path = trimmed.includes('/') ? trimmed : `${metadataSourceRoot}/${trimmed}`
    if (basename(path) !== contribution.fixedFileName || path !== `${metadataSourceRoot}/${contribution.fixedFileName}`) {
      return { error: `${contribution.displayName} must be ${metadataSourceRoot}/${contribution.fixedFileName}.` }
    }
    return { path }
  }

  if (!contribution.fileSuffix) {
    return defaultFileName ? { path: `${metadataSourceRoot}/${defaultFileName}` } : { error: 'This metadata type has no file template.' }
  }

  const filePath = directoryInput ? `${trimmed}/${defaultFileName}` : trimmed
  const withSuffix = filePath.endsWith('.json') ? filePath : `${filePath}${contribution.fileSuffix}`
  if (!withSuffix.endsWith(contribution.fileSuffix)) {
    return { error: `${contribution.displayName} files must end with ${contribution.fileSuffix}.` }
  }
  if (withSuffix.includes('/') || !selectedDirectory) {
    return { path: withSuffix.includes('/') ? withSuffix : `${metadataSourceRoot}/${withSuffix}` }
  }
  return { path: `${selectedDirectory}/${withSuffix}` }
}

async function promptForTemplateValues(
  contribution: MetadataTypeContribution,
  targetPath: string,
): Promise<MetadataFileTemplateValues | undefined> {
  const fields = contribution.fileTemplate?.fields ?? []
  if (fields.length === 0) {
    return {}
  }

  const defaults = createMetadataFileTemplateDefaultValues(contribution, targetPath)
  const values: MetadataFileTemplateValues = {}
  for (const field of fields) {
    const value = await promptForTemplateField(contribution, field, defaults[field.name])
    if (value === undefined) {
      return undefined
    }
    values[field.name] = value
  }
  return values
}

async function promptForTemplateField(
  contribution: MetadataTypeContribution,
  field: MetadataFileTemplateField,
  defaultValue: unknown,
): Promise<string | undefined> {
  const value = await vscode.window.showInputBox({
    prompt: templateFieldPrompt(contribution, field),
    value: defaultValue === undefined ? '' : String(defaultValue),
    ignoreFocusOut: true,
    validateInput: (input) => field.required && input.trim() === '' ? `${field.label} is required.` : undefined,
  })
  return value === undefined ? undefined : value.trim()
}

function templateFieldPrompt(
  contribution: MetadataTypeContribution,
  field: MetadataFileTemplateField,
): string {
  const title = `New ${contribution.displayName} ${field.label}`
  return field.labelRemark ? `${title}\n${field.labelRemark}` : title
}

async function fileExists(uri: vscode.Uri): Promise<boolean> {
  return vscode.workspace.fs.stat(uri).then(() => true, () => false)
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

function trimSlashes(path: string): string {
  return path.replace(/^\/+/g, '').replace(/\/+$/g, '')
}

function basename(path: string): string {
  return normalizePath(path).split('/').pop() ?? ''
}

function dirname(path: string): string | undefined {
  const normalizedPath = trimSlashes(normalizePath(path))
  const index = normalizedPath.lastIndexOf('/')
  return index > 0 ? normalizedPath.slice(0, index) : undefined
}

async function openTideStackDevelopConfigFiles(): Promise<void> {
  const workspaceFolder = await selectWorkspaceFolder()
  if (!workspaceFolder) {
    return
  }

  const projectConfig = await readProjectConfig(workspaceFolder)
  const localConfig = await readLocalConfig(workspaceFolder)
  await writeProjectConfig(workspaceFolder, projectConfig)
  await writeLocalConfig(workspaceFolder, localConfig)

  const projectDocument = await vscode.workspace.openTextDocument(projectConfigUri(workspaceFolder))
  await vscode.window.showTextDocument(projectDocument, { preview: false, viewColumn: vscode.ViewColumn.One })

  const localDocument = await vscode.workspace.openTextDocument(localConfigUri(workspaceFolder))
  await vscode.window.showTextDocument(localDocument, { preview: false, viewColumn: vscode.ViewColumn.Beside })
}

async function configureTideStackDevelop(): Promise<void> {
  const workspaceFolder = await selectWorkspaceFolder()
  if (!workspaceFolder) {
    return
  }

  const projectConfig = await readProjectConfig(workspaceFolder)
  const localConfig = await readLocalConfig(workspaceFolder)

  const developmentServerUrl = await promptForValue(
    'Development server URL',
    projectConfig.developmentServerUrl,
    'http://localhost:88',
  )
  if (developmentServerUrl === undefined) {
    return
  }

  const appName = await promptForValue('Application name', projectConfig.appName)
  if (appName === undefined) {
    return
  }

  const devKey = await promptForValue('Dev key from TideStack', localConfig.devKey, undefined, true)
  if (devKey === undefined) {
    return
  }

  await writeProjectConfig(workspaceFolder, {
    ...projectConfig,
    schemaVersion: projectConfig.schemaVersion || currentDevelopConfigContract().schemaVersion,
    developmentServerUrl: developmentServerUrl.trim(),
    appName: appName.trim(),
  })

  await writeLocalConfig(workspaceFolder, {
    ...localConfig,
    schemaVersion: localConfig.schemaVersion || currentDevelopConfigContract().schemaVersion,
    devKey: devKey.trim(),
  })

  await vscode.window.showInformationMessage(
    `TideStack Develop Config saved to ${currentDevelopConfigContract().project.path} and ${currentDevelopConfigContract().local.path}.`,
  )
}

async function selectWorkspaceFolder(): Promise<vscode.WorkspaceFolder | undefined> {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders || workspaceFolders.length === 0) {
    await vscode.window.showErrorMessage('Open a workspace before configuring TideStack Develop Config.')
    return undefined
  }

  const activeUri = vscode.window.activeTextEditor?.document.uri
  if (activeUri) {
    const activeFolder = vscode.workspace.getWorkspaceFolder(activeUri)
    if (activeFolder) {
      return activeFolder
    }
  }

  if (workspaceFolders.length === 1) {
    return workspaceFolders[0]
  }

  const selected = await vscode.window.showQuickPick(
    workspaceFolders.map((folder) => ({ label: folder.name, description: folder.uri.fsPath, folder })),
    { placeHolder: 'Select the workspace for TideStack Develop Config' },
  )
  return selected?.folder
}

async function promptForValue(
  prompt: string,
  value: string,
  placeHolder?: string,
  password?: boolean,
): Promise<string | undefined> {
  return vscode.window.showInputBox({
    prompt,
    value,
    placeHolder,
    password,
    ignoreFocusOut: true,
  })
}

async function readProjectConfig(workspaceFolder: vscode.WorkspaceFolder): Promise<ProjectConfig> {
  const parsed = await readJsonObject(projectConfigUri(workspaceFolder))
  const legacyConfig = vscode.workspace.getConfiguration('tideStack.debug', workspaceFolder.uri)
  return {
    schemaVersion: readNumber(parsed, 'schemaVersion') || currentDevelopConfigContract().schemaVersion,
    developmentServerUrl: readContractString(parsed, currentDevelopConfigContract().project, 'developmentServerUrl') || legacyConfig.get<string>('platformUrl') || '',
    appName: readString(parsed, 'appName') || legacyConfig.get<string>('appName') || '',
  }
}

async function readLocalConfig(workspaceFolder: vscode.WorkspaceFolder): Promise<LocalConfig> {
  const parsed = await readJsonObject(localConfigUri(workspaceFolder))
  const legacyConfig = vscode.workspace.getConfiguration('tideStack.debug', workspaceFolder.uri)
  return {
    schemaVersion: readNumber(parsed, 'schemaVersion') || currentDevelopConfigContract().schemaVersion,
    devKey: readContractString(parsed, currentDevelopConfigContract().local, 'devKey') || legacyConfig.get<string>('devKey') || legacyConfig.get<string>('debugKey') || '',
  }
}

async function writeProjectConfig(workspaceFolder: vscode.WorkspaceFolder, config: ProjectConfig): Promise<void> {
  const existing = await readJsonObject(projectConfigUri(workspaceFolder))
  await writeJsonObject(projectConfigUri(workspaceFolder), orderContractFields(existing, {
    schemaVersion: config.schemaVersion,
    developmentServerUrl: config.developmentServerUrl,
    appName: config.appName,
  }, currentDevelopConfigContract().project))
}

async function writeLocalConfig(workspaceFolder: vscode.WorkspaceFolder, config: LocalConfig): Promise<void> {
  const existing = await readJsonObject(localConfigUri(workspaceFolder))
  await writeJsonObject(localConfigUri(workspaceFolder), orderContractFields(existing, {
    schemaVersion: config.schemaVersion,
    devKey: config.devKey,
  }, currentDevelopConfigContract().local))
}

async function readJsonObject(uri: vscode.Uri): Promise<JsonObject> {
  try {
    const bytes = await vscode.workspace.fs.readFile(uri)
    const parsed = JSON.parse(Buffer.from(bytes).toString('utf8'))
    if (!isJsonObject(parsed)) {
      throw new Error(`TideStack develop config must be a JSON object: ${uri.toString()}`)
    }
    return parsed
  } catch (error) {
    if (isFileNotFound(error)) {
      return {}
    }
    throw error
  }
}

async function writeJsonObject(uri: vscode.Uri, value: JsonObject): Promise<void> {
  const parent = vscode.Uri.joinPath(uri, '..')
  await vscode.workspace.fs.createDirectory(parent)
  const content = `${JSON.stringify(value, null, 2)}\n`
  await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'))
}

function orderContractFields(existing: JsonObject, knownFields: JsonObject, section: ConfigSectionContract): JsonObject {
  const knownNames = new Set([
    ...section.fields,
    ...Object.values(section.legacyAliases).flat(),
    ...(section.removedFields ?? []),
  ])
  const ordered: JsonObject = {}
  for (const field of section.fields) {
    if (field in knownFields) {
      ordered[field] = knownFields[field]
    }
  }
  for (const [key, value] of Object.entries(existing)) {
    if (!knownNames.has(key)) {
      ordered[key] = value
    }
  }
  return ordered
}

function projectConfigUri(workspaceFolder: vscode.WorkspaceFolder): vscode.Uri {
  return vscode.Uri.joinPath(workspaceFolder.uri, ...currentDevelopConfigContract().project.path.split('/'))
}

function localConfigUri(workspaceFolder: vscode.WorkspaceFolder): vscode.Uri {
  return vscode.Uri.joinPath(workspaceFolder.uri, ...currentDevelopConfigContract().local.path.split('/'))
}

function readString(value: JsonObject, key: string): string {
  const rawValue = value[key]
  return typeof rawValue === 'string' ? rawValue : ''
}

function readNumber(value: JsonObject, key: string): number {
  const rawValue = value[key]
  return typeof rawValue === 'number' ? rawValue : 0
}

function readContractString(value: JsonObject, section: ConfigSectionContract, key: string): string {
  for (const field of [key, ...(section.legacyAliases[key] ?? [])]) {
    const result = readString(value, field)
    if (result) {
      return result
    }
  }
  return ''
}

async function loadDevelopConfigContract(context: vscode.ExtensionContext): Promise<TideStackDevelopConfigContract> {
  const uri = vscode.Uri.joinPath(context.extensionUri, ...developConfigContractRelativePath.split('/'))
  const bytes = await vscode.workspace.fs.readFile(uri)
  const parsed = JSON.parse(Buffer.from(bytes).toString('utf8'))
  if (!isJsonObject(parsed) || !isConfigSectionContract(parsed.project) || !isConfigSectionContract(parsed.local)) {
    throw new Error(`Invalid TideStack develop config contract: ${uri.toString()}`)
  }
  return {
    schemaVersion: typeof parsed.schemaVersion === 'number' ? parsed.schemaVersion : 1,
    project: parsed.project,
    local: parsed.local,
  }
}

async function withDevelopConfigContract(
  context: vscode.ExtensionContext,
  action: () => Promise<void>,
): Promise<void> {
  developConfigContractPromise ??= loadDevelopConfigContract(context)
  developConfigContract = await developConfigContractPromise
  await action()
}

function currentDevelopConfigContract(): TideStackDevelopConfigContract {
  if (!developConfigContract) {
    throw new Error('TideStack Develop Config contract has not been loaded')
  }
  return developConfigContract
}

function isConfigSectionContract(value: unknown): value is ConfigSectionContract {
  return isJsonObject(value)
    && typeof value.path === 'string'
    && Array.isArray(value.fields)
    && value.fields.every((field) => typeof field === 'string')
    && isJsonObject(value.legacyAliases)
    && Object.values(value.legacyAliases).every(
      (aliases) => Array.isArray(aliases) && aliases.every((alias) => typeof alias === 'string'),
    )
    && (value.removedFields === undefined
      || (Array.isArray(value.removedFields) && value.removedFields.every((field) => typeof field === 'string')))
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isFileNotFound(error: unknown): boolean {
  if (error instanceof vscode.FileSystemError) {
    return error.code === 'FileNotFound'
  }
  return error instanceof Error && /FileNotFound|ENOENT/.test(error.message)
}
