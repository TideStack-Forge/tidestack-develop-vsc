import type {
  MetadataDiagnostic,
  MetadataEditorKind,
  MetadataFileTemplate,
  MetadataPathMapping,
  MetadataTypeContribution,
} from './types'
import contributionManifest from './metadataTypeContributions.json'

const SOURCE_ROOT = 'src/main/metadata/'
const PACKAGED_RESOURCE_ROOT = 'resources/META-INF/ouroboros/'
const METADATA_RESOURCE_DIRECTORY = 'metadata/'
const FIXED_METADATA_FILE_TYPES: Record<string, string> = {
  'app-modules.json': 'app-module',
  'configuration.json': 'configuration',
  'configuration-groups.json': 'configuration-group',
}
const FIXED_METADATA_TYPES = new Set(Object.values(FIXED_METADATA_FILE_TYPES))

interface MetadataTypeContributionDefinition {
  type: string
  fileSuffix?: `.${string}.json`
  fixedFileName?: string
  displayName: string
  sourcePathPatterns: string[]
  packagedPathPrefix: `META-INF/ouroboros/${string}`
  packagedPathPatterns?: string[]
  editorKind?: MetadataEditorKind
  editorKinds: MetadataEditorKind[]
  documentShape?: 'object' | 'array'
  jsonSchema: Record<string, unknown>
  editorSchema: Record<string, unknown>
  fileTemplate?: MetadataFileTemplate
}

const contributionDefinitions = contributionManifest.types as MetadataTypeContributionDefinition[]

export const metadataTypeContributions: MetadataTypeContribution[] = contributionDefinitions.map((definition) => ({
  type: definition.type,
  fileSuffix: definition.fileSuffix,
  fixedFileName: definition.fixedFileName,
  displayName: definition.displayName,
  sourcePathPatterns: [...definition.sourcePathPatterns],
  packagedPathPrefix: definition.packagedPathPrefix,
  packagedPathPatterns: [...(definition.packagedPathPatterns ?? [])],
  editorKind: definition.editorKind ?? definition.editorKinds[0] ?? 'form',
  editorKinds: [...definition.editorKinds],
  documentShape: definition.documentShape ?? 'object',
  jsonSchema: cloneObject(definition.jsonSchema),
  fileTemplate: definition.fileTemplate ? cloneValue(definition.fileTemplate) : undefined,
  createEditorSchema: () => cloneObject(definition.editorSchema),
  normalize: normalizeObject,
}))

export function getContributionByType(type: string): MetadataTypeContribution | undefined {
  return metadataTypeContributions.find((contribution) => contribution.type === type)
}

export function getContributionBySuffix(uri: string): MetadataTypeContribution | undefined {
  const contribution = getRawContributionBySuffix(uri)
  return contribution && !FIXED_METADATA_TYPES.has(contribution.type) ? contribution : undefined
}

export function getContributionByPackagedPath(uri: string): MetadataTypeContribution | undefined {
  const relativePath = getPackagedResourceRelativePath(uri)
  if (!relativePath) {
    return undefined
  }
  if (relativePath.startsWith(METADATA_RESOURCE_DIRECTORY)) {
    return getContributionByMetadataRelativePath(relativePath.slice(METADATA_RESOURCE_DIRECTORY.length))
  }
  return metadataTypeContributions.find((contribution) => {
    const runtimeDirectory = contribution.packagedPathPrefix.replace('META-INF/ouroboros/', '')
    return contribution.packagedPathPatterns?.includes(relativePath) === true
      || relativePath.startsWith(`${runtimeDirectory}/`)
  })
}

export function mapMetadataSourcePath(uri: string): MetadataPathMapping | undefined {
  const normalizedPath = normalizePath(uri)
  const sourceRootIndex = normalizedPath.lastIndexOf(SOURCE_ROOT)
  const sourceRelativePath = sourceRootIndex >= 0 ? normalizedPath.slice(sourceRootIndex + SOURCE_ROOT.length) : undefined
  const contribution = sourceRelativePath
    ? getContributionByMetadataRelativePath(sourceRelativePath)
    : getContributionBySuffix(normalizedPath)
  if (!contribution) {
    return undefined
  }

  const relativePath = sourceRelativePath ?? normalizedPath.slice(normalizedPath.lastIndexOf('/') + 1)
  const diagnostics: MetadataDiagnostic[] = []

  return {
    type: contribution.type,
    sourcePath: normalizedPath,
    packagedPath: `META-INF/ouroboros/metadata/${relativePath}`,
    contribution,
    diagnostics,
  }
}

export function mapMetadataPackagedResourcePath(uri: string): MetadataPathMapping | undefined {
  const normalizedPath = normalizePath(uri)
  const relativePath = getPackagedResourceRelativePath(normalizedPath)
  if (!relativePath || !relativePath.endsWith('.json')) {
    return undefined
  }

  const contribution = getContributionByPackagedPath(normalizedPath)
  if (!contribution) {
    return undefined
  }

  const suffixContribution = getRawContributionBySuffix(normalizedPath)
  const diagnostics: MetadataDiagnostic[] = []
  if (suffixContribution && suffixContribution.type !== contribution.type) {
    diagnostics.push({
      code: 'metadata-path-suffix-conflict',
      message: `Packaged path ${contribution.packagedPathPrefix} resolves this file as ${contribution.type}, but suffix ${suffixContribution.fileSuffix} resolves it as ${suffixContribution.type}.`,
      severity: 'error',
      path: normalizedPath,
    })
  }

  return {
    type: contribution.type,
    sourcePath: normalizedPath,
    packagedPath: `META-INF/ouroboros/${relativePath}`,
    contribution,
    diagnostics,
  }
}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

function getPackagedResourceRelativePath(path: string): string | undefined {
  const normalizedPath = normalizePath(path)
  const resourceRootIndex = normalizedPath.lastIndexOf(PACKAGED_RESOURCE_ROOT)
  if (resourceRootIndex < 0) {
    return undefined
  }
  return normalizedPath.slice(resourceRootIndex + PACKAGED_RESOURCE_ROOT.length)
}

function getContributionByMetadataRelativePath(relativePath: string): MetadataTypeContribution | undefined {
  const normalizedPath = normalizePath(relativePath)
  const fixedType = FIXED_METADATA_FILE_TYPES[normalizedPath]
  if (fixedType) {
    return getContributionByType(fixedType)
  }
  const contribution = getContributionBySuffix(normalizedPath)
  return contribution && !FIXED_METADATA_TYPES.has(contribution.type) ? contribution : undefined
}

function getRawContributionBySuffix(uri: string): MetadataTypeContribution | undefined {
  return metadataTypeContributions.find((contribution) => contribution.fileSuffix && uri.endsWith(contribution.fileSuffix))
}

function normalizeObject<TDocument>(document: TDocument): TDocument {
  if (Array.isArray(document)) {
    return document.map((item) => normalizeObject(item)) as TDocument
  }
  if (!document || typeof document !== 'object') {
    return document
  }
  return Object.fromEntries(
    Object.entries(document).map(([key, value]) => [key, normalizeObject(value)]),
  ) as TDocument
}

function cloneObject(value: Record<string, unknown>): Record<string, unknown> {
  return cloneValue(value) as Record<string, unknown>
}

function cloneValue<TValue>(value: TValue): TValue {
  return JSON.parse(JSON.stringify(value)) as TValue
}
