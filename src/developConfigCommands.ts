import * as vscode from 'vscode'
import {
  localDevelopConfigDocument,
  localDevelopConfigFromDocument,
  projectDevelopConfigDocument,
  projectDevelopConfigFromDocument,
  type JsonObject,
  type TideStackDevelopConfigContract,
  type TideStackDevelopConfigSectionContract,
  type TideStackDevelopLocalConfig as LocalConfig,
  type TideStackDevelopProjectConfig as ProjectConfig,
} from 'ouroboros-metadata-editor'
import {
  isFileNotFound,
  isJsonObject,
  normalizeCommandUri,
  text,
} from './vscodeShared'

const developConfigContractRelativePath = 'dist/contracts/tidestack-develop-config.json'

let developConfigContract: TideStackDevelopConfigContract | undefined
let developConfigContractPromise: Promise<TideStackDevelopConfigContract> | undefined

export function registerDevelopConfigCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
  return [
    vscode.commands.registerCommand(
      'tidestack.develop.openConfig',
      (uri?: vscode.Uri) => withDevelopConfigContract(context, () => openTideStackDevelopConfigFiles(uri)),
    ),
    vscode.commands.registerCommand(
      'tidestack.develop.configure',
      (uri?: vscode.Uri) => withDevelopConfigContract(context, () => configureTideStackDevelop(uri)),
    ),
  ]
}

async function openTideStackDevelopConfigFiles(uri?: vscode.Uri): Promise<void> {
  const workspaceFolder = await selectWorkspaceFolder(uri)
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

async function configureTideStackDevelop(uri?: vscode.Uri): Promise<void> {
  const workspaceFolder = await selectWorkspaceFolder(uri)
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

async function selectWorkspaceFolder(uri?: vscode.Uri): Promise<vscode.WorkspaceFolder | undefined> {
  const commandUri = normalizeCommandUri(uri)
  if (commandUri) {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(commandUri)
    if (workspaceFolder) {
      return workspaceFolder
    }
  }

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
