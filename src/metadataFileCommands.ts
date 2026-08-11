import * as vscode from 'vscode'
import {
  createMetadataFileCreationFieldModels,
  createMetadataFileCreationFlowModel,
  createMetadataFileCreationPlanFromFlow,
  getContributionByType,
  localizeMetadataTypeContribution,
  mapMetadataPackagedResourcePath,
  mapMetadataSourcePath,
  metadataEditorRegistrationDefinitions,
  metadataTypeContributions,
  newMetadataFileCommandDefinitions,
  normalizeMetadataFileCreationPath,
  validateMetadataFileCreationField,
  type MetadataFileCreationFieldModel,
  type MetadataFileCreationFlowModel,
  type MetadataFileTemplateValues,
  type MetadataTypeContribution,
} from 'ouroboros-metadata-editor'
import { MetadataCustomEditorProvider, type MetadataCustomEditorRegistration } from './metadataCustomEditor'
import {
  currentIdeLocale,
  dirname,
  fileExists,
  normalizeCommandUri,
  normalizePath,
  text,
  trimSlashes,
} from './vscodeShared'

const metadataEditorRegistrations: MetadataCustomEditorRegistration[] = metadataEditorRegistrationDefinitions
const newMetadataFileCommands = newMetadataFileCommandDefinitions

export function registerMetadataFileCommands(context: vscode.ExtensionContext): vscode.Disposable[] {
  return [
    ...metadataEditorRegistrations.map((registration) => MetadataCustomEditorProvider.register(context, registration)),
    vscode.commands.registerCommand('tidestack.metadata.openSource', openMetadataSourceEditor),
    vscode.commands.registerCommand('tidestack.metadata.openVisual', openMetadataVisualEditor),
    vscode.commands.registerCommand('tidestack.metadata.newFile', createMetadataFile),
    ...newMetadataFileCommands.map(({ command, metadataType }) => vscode.commands.registerCommand(
      command,
      (uri?: vscode.Uri) => createMetadataFile(uri, metadataType),
    )),
  ]
}

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

  const selectedDirectory = await selectedRelativeDirectory(workspaceFolder, selectedUri)
  const moduleRootDirectory = await findNearestMavenModuleRoot(workspaceFolder, selectedDirectory)
  const creationModel = createMetadataFileCreationFlowModel(localizedContribution, {
    selectedDirectory,
    moduleRootDirectory,
    locale,
  })

  const pathInput = await promptForMetadataPath(localizedContribution, creationModel, locale)
  if (!pathInput) {
    return
  }
  const targetPath = normalizeMetadataFileCreationPath(localizedContribution, creationModel, pathInput, locale).path
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

  const creationResult = createMetadataFileCreationPlanFromFlow(
    localizedContribution,
    creationModel,
    pathInput,
    templateValues,
    locale,
  )
  if (!creationResult.plan) {
    await vscode.window.showErrorMessage(creationResult.error ?? text('metadata.error.enterPath'))
    return
  }
  const creationPlan = creationResult.plan
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
  contribution: MetadataTypeContribution,
  creationModel: MetadataFileCreationFlowModel,
  locale: string,
): Promise<string | undefined> {
  if (creationModel.pathInputLocked) {
    return creationModel.defaultPathInput
  }
  const value = await vscode.window.showInputBox({
    prompt: creationModel.pathPrompt,
    value: creationModel.defaultPathInput,
    ignoreFocusOut: true,
    validateInput: (input) => normalizeMetadataFileCreationPath(contribution, creationModel, input, locale).error,
  })
  return value
}

async function findNearestMavenModuleRoot(
  workspaceFolder: vscode.WorkspaceFolder,
  selectedDirectory: string | undefined,
): Promise<string | undefined> {
  let current = trimSlashes(normalizePath(selectedDirectory ?? ''))
  while (current) {
    if (await fileExists(vscode.Uri.joinPath(workspaceFolder.uri, ...current.split('/'), 'pom.xml'))) {
      return current
    }
    const parent = dirname(current)
    if (!parent || parent === current) {
      return undefined
    }
    current = parent
  }
  return undefined
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
  const fieldModels = createMetadataFileCreationFieldModels(contribution, targetPath, locale)
  if (fieldModels.length === 0) {
    return {}
  }

  const values: MetadataFileTemplateValues = {}
  for (const field of fieldModels) {
    const value = await promptForTemplateField(field, locale)
    if (value === undefined) {
      return undefined
    }
    values[field.name] = value
  }
  return values
}

async function promptForTemplateField(
  field: MetadataFileCreationFieldModel,
  locale: string,
): Promise<string | undefined> {
  const value = await vscode.window.showInputBox({
    prompt: field.prompt,
    value: field.defaultValue === undefined ? '' : String(field.defaultValue),
    ignoreFocusOut: true,
    validateInput: (input) => validateMetadataFileCreationField(
      field,
      input,
      locale,
    ),
  })
  return value === undefined ? undefined : value.trim()
}
