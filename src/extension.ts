import * as vscode from 'vscode'
import {
  createMetadataFileCreationPlan,
  createMetadataFileTemplateDefaultValues,
  defaultMetadataFilePath,
  getContributionByType,
  localDevelopConfigDocument,
  localDevelopConfigFromDocument,
  localizeMetadataTypeContribution,
  mapMetadataPackagedResourcePath,
  mapMetadataSourcePath,
  metadataFilePathPrompt,
  metadataEditorRegistrationDefinitions,
  metadataTemplateFieldPrompt,
  metadataTypeContributions,
  newMetadataFileCommandDefinitions,
  normalizeIdeLocale,
  normalizeMetadataFilePath,
  projectDevelopConfigDocument,
  projectDevelopConfigFromDocument,
  tideStackText,
  type JsonObject,
  type MetadataFileTemplateField,
  type MetadataFileTemplateValues,
  type MetadataTypeContribution,
  type TideStackDevelopConfigContract,
  type TideStackDevelopConfigSectionContract,
  type TideStackDevelopLocalConfig as LocalConfig,
  type TideStackDevelopProjectConfig as ProjectConfig,
} from 'ouroboros-metadata-editor'
import { MetadataCustomEditorProvider, type MetadataCustomEditorRegistration } from './metadataCustomEditor'

const developConfigContractRelativePath = 'dist/contracts/tidestack-develop-config.json'

const metadataEditorRegistrations: MetadataCustomEditorRegistration[] = metadataEditorRegistrationDefinitions
const newMetadataFileCommands = newMetadataFileCommandDefinitions

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
    await vscode.window.showWarningMessage(text('metadata.switch.openVisualFirst'))
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
    await vscode.window.showWarningMessage(text('metadata.switch.openJsonFirst'))
    return
  }

  const registration = resolveMetadataEditorRegistration(targetUri)
  if (!registration) {
    await vscode.window.showWarningMessage(text('metadata.switch.unsupportedJson'))
    return
  }

  await vscode.commands.executeCommand('vscode.openWith', targetUri, registration.viewType, {
    preview: false,
    viewColumn: vscode.ViewColumn.Active,
  })
}

async function createMetadataFile(uri?: vscode.Uri, metadataType?: string): Promise<void> {
  const locale = currentIdeLocale()
  const selectedUri = normalizeCommandUri(uri)
  const workspaceFolder = await selectWorkspaceFolderForUri(selectedUri)
  if (!workspaceFolder) {
    return
  }

  const contribution = metadataType
    ? getContributionByType(metadataType)
    : await selectMetadataContribution(locale)
  if (!contribution) {
    if (metadataType) {
      await vscode.window.showErrorMessage(text('metadata.error.unsupportedType', { metadataType }))
    }
    return
  }
  const localizedContribution = localizeMetadataTypeContribution(contribution, locale)

  const targetPath = await promptForMetadataPath(workspaceFolder, selectedUri, localizedContribution, locale)
  if (!targetPath) {
    return
  }

  const templateValues = await promptForTemplateValues(localizedContribution, targetPath, locale)
  if (!templateValues) {
    return
  }

  const targetUri = vscode.Uri.joinPath(workspaceFolder.uri, ...targetPath.split('/'))
  if (await fileExists(targetUri)) {
    await vscode.window.showErrorMessage(text('metadata.error.fileExists', { targetPath }))
    return
  }

  const creationPlan = createMetadataFileCreationPlan(localizedContribution, targetPath, templateValues)
  const targetParts = creationPlan.targetPath.split('/')
  await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(workspaceFolder.uri, ...targetParts.slice(0, -1)))
  await vscode.workspace.fs.writeFile(targetUri, Buffer.from(creationPlan.text, 'utf8'))

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
    await vscode.window.showErrorMessage(text('metadata.error.openWorkspace'))
    return undefined
  }
  if (workspaceFolders.length === 1) {
    return workspaceFolders[0]
  }
  const selected = await vscode.window.showQuickPick(
    workspaceFolders.map((folder) => ({ label: folder.name, description: folder.uri.fsPath, folder })),
    { placeHolder: text('metadata.new.selectWorkspace') },
  )
  return selected?.folder
}

async function selectMetadataContribution(locale: string): Promise<MetadataTypeContribution | undefined> {
  const selected = await vscode.window.showQuickPick(
    metadataTypeContributions
      .filter((contribution) => contribution.fileTemplate)
      .map((contribution) => ({
        label: localizeMetadataTypeContribution(contribution, locale).displayName,
        description: contribution.fileTemplate?.defaultFileName,
        contribution,
      })),
    { placeHolder: text('metadata.new.selectType') },
  )
  return selected?.contribution
}

async function promptForMetadataPath(
  workspaceFolder: vscode.WorkspaceFolder,
  selectedUri: vscode.Uri | undefined,
  contribution: MetadataTypeContribution,
  locale: string,
): Promise<string | undefined> {
  const selectedDirectory = await selectedRelativeDirectory(workspaceFolder, selectedUri)
  const defaultPath = defaultMetadataFilePath(selectedDirectory, contribution)
  const value = await vscode.window.showInputBox({
    prompt: metadataFilePathPrompt(contribution, locale),
    value: defaultPath,
    ignoreFocusOut: true,
    validateInput: (input) => normalizeMetadataFilePath(input, contribution, selectedDirectory, locale).error,
  })
  return value === undefined ? undefined : normalizeMetadataFilePath(value, contribution, selectedDirectory, locale).path
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

async function promptForTemplateValues(
  contribution: MetadataTypeContribution,
  targetPath: string,
  locale: string,
): Promise<MetadataFileTemplateValues | undefined> {
  const fields = contribution.fileTemplate?.fields ?? []
  if (fields.length === 0) {
    return {}
  }

  const defaults = createMetadataFileTemplateDefaultValues(contribution, targetPath)
  const values: MetadataFileTemplateValues = {}
  for (const field of fields) {
    const value = await promptForTemplateField(contribution, field, defaults[field.name], locale)
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
  locale: string,
): Promise<string | undefined> {
  const value = await vscode.window.showInputBox({
    prompt: metadataTemplateFieldPrompt(contribution, field, locale),
    value: defaultValue === undefined ? '' : String(defaultValue),
    ignoreFocusOut: true,
    validateInput: (input) => field.required && input.trim() === ''
      ? text('metadata.error.fieldRequired', { label: field.label })
      : undefined,
  })
  return value === undefined ? undefined : value.trim()
}

function currentIdeLocale(): 'zh-CN' | 'en-US' {
  return normalizeIdeLocale(vscode.env.language)
}

function text(key: string, data?: Record<string, unknown>): string {
  return tideStackText(key, currentIdeLocale(), data)
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
    text('settings.prompt.developmentServerUrl'),
    projectConfig.developmentServerUrl,
    'http://localhost:88',
  )
  if (developmentServerUrl === undefined) {
    return
  }

  const appName = await promptForValue(text('settings.prompt.appName'), projectConfig.appName)
  if (appName === undefined) {
    return
  }

  const devKey = await promptForValue(text('settings.prompt.devKey'), localConfig.devKey, undefined, true)
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
    text('settings.savedMessage', {
      projectPath: currentDevelopConfigContract().project.path,
      localPath: currentDevelopConfigContract().local.path,
    }),
  )
}

async function selectWorkspaceFolder(): Promise<vscode.WorkspaceFolder | undefined> {
  const workspaceFolders = vscode.workspace.workspaceFolders
  if (!workspaceFolders || workspaceFolders.length === 0) {
    await vscode.window.showErrorMessage(text('metadata.error.openWorkspace'))
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
    { placeHolder: text('metadata.new.selectWorkspace') },
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
  return projectDevelopConfigFromDocument(parsed, currentDevelopConfigContract(), {
    developmentServerUrl: legacyConfig.get<string>('platformUrl') || '',
    appName: legacyConfig.get<string>('appName') || '',
  })
}

async function readLocalConfig(workspaceFolder: vscode.WorkspaceFolder): Promise<LocalConfig> {
  const parsed = await readJsonObject(localConfigUri(workspaceFolder))
  const legacyConfig = vscode.workspace.getConfiguration('tideStack.debug', workspaceFolder.uri)
  return localDevelopConfigFromDocument(parsed, currentDevelopConfigContract(), {
    devKey: legacyConfig.get<string>('devKey') || legacyConfig.get<string>('debugKey') || '',
  })
}

async function writeProjectConfig(workspaceFolder: vscode.WorkspaceFolder, config: ProjectConfig): Promise<void> {
  const existing = await readJsonObject(projectConfigUri(workspaceFolder))
  await writeJsonObject(projectConfigUri(workspaceFolder), projectDevelopConfigDocument(existing, config, currentDevelopConfigContract()))
}

async function writeLocalConfig(workspaceFolder: vscode.WorkspaceFolder, config: LocalConfig): Promise<void> {
  const existing = await readJsonObject(localConfigUri(workspaceFolder))
  await writeJsonObject(localConfigUri(workspaceFolder), localDevelopConfigDocument(existing, config, currentDevelopConfigContract()))
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

function projectConfigUri(workspaceFolder: vscode.WorkspaceFolder): vscode.Uri {
  return vscode.Uri.joinPath(workspaceFolder.uri, ...currentDevelopConfigContract().project.path.split('/'))
}

function localConfigUri(workspaceFolder: vscode.WorkspaceFolder): vscode.Uri {
  return vscode.Uri.joinPath(workspaceFolder.uri, ...currentDevelopConfigContract().local.path.split('/'))
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

function isConfigSectionContract(value: unknown): value is TideStackDevelopConfigSectionContract {
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
