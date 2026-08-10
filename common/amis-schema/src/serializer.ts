import type {
  MetadataDiagnostic,
  MetadataFileTemplateField,
  MetadataFileTemplateFieldDefault,
  MetadataTypeContribution,
} from './types'

const METADATA_SOURCE_ROOT = 'src/main/metadata/'

export interface ParsedMetadataDocument {
  value?: unknown
  diagnostics: MetadataDiagnostic[]
}

export function parseMetadataJson(text: string): ParsedMetadataDocument {
  try {
    return { value: JSON.parse(text), diagnostics: [] }
  } catch (error) {
    return {
      diagnostics: [
        {
          code: 'invalid-json',
          message: error instanceof Error ? error.message : 'Invalid JSON document.',
          severity: 'error',
        },
      ],
    }
  }
}

export function serializeMetadataDocument(value: unknown, contribution?: MetadataTypeContribution): string {
  const normalized = contribution?.normalize ? contribution.normalize(value) : value
  return `${JSON.stringify(normalized, null, 2)}\n`
}

export type MetadataFileTemplateValues = Record<string, unknown>

export function serializeMetadataFileTemplate(
  contribution: MetadataTypeContribution,
  values: MetadataFileTemplateValues = {},
): string {
  if (!contribution.fileTemplate) {
    throw new Error(`Metadata type ${contribution.type} does not declare a file template.`)
  }
  return serializeMetadataDocument(applyMetadataFileTemplateValues(contribution.fileTemplate.document, contribution.fileTemplate.fields ?? [], values), contribution)
}

export function applyMetadataFileTemplateValues(
  document: unknown,
  fields: MetadataFileTemplateField[],
  values: MetadataFileTemplateValues,
): unknown {
  const nextDocument = cloneValue(document)
  for (const field of fields) {
    if (!(field.name in values)) {
      continue
    }
    setPathValue(nextDocument, field.documentPath, values[field.name])
  }
  return nextDocument
}

export function createMetadataFileTemplateDefaultValues(
  contribution: MetadataTypeContribution,
  targetPath: string,
): MetadataFileTemplateValues {
  const template = contribution.fileTemplate
  if (!template?.fields) {
    return {}
  }
  const defaults: MetadataFileTemplateValues = {}
  for (const field of template.fields) {
    defaults[field.name] = field.defaultFromPath
      ? createPathDefaultValue(targetPath, contribution, field.defaultFromPath)
      : getPathValue(template.document, field.documentPath)
  }
  return defaults
}

function createPathDefaultValue(
  targetPath: string,
  contribution: MetadataTypeContribution,
  defaultFormat: MetadataFileTemplateFieldDefault,
): string {
  const parts = createNameParts(targetPath, contribution)
  if (defaultFormat === 'title') {
    return parts.length ? parts[parts.length - 1].words.join(' ') : 'Example'
  }
  if (defaultFormat === 'slash-path') {
    return `/${parts.map((part) => part.kebab).filter(Boolean).join('/') || 'example'}`
  }
  if (defaultFormat === 'dot-name') {
    return parts.map((part) => part.pascal).filter(Boolean).join('.') || 'Example'
  }
  return parts.map((part) => part.camel).filter(Boolean).join('.') || 'example'
}

function createNameParts(targetPath: string, contribution: MetadataTypeContribution): Array<{
  words: string[]
  kebab: string
  camel: string
  pascal: string
}> {
  return createNameStem(targetPath, contribution)
    .split(/[/.]+/)
    .map((segment) => wordsFromSegment(segment))
    .filter((words) => words.length > 0)
    .map((words) => {
      const normalizedWords = words.map((word) => word.toLowerCase())
      const pascalWords = normalizedWords.map(capitalize)
      return {
        words: pascalWords,
        kebab: normalizedWords.join('-'),
        camel: normalizedWords.map((word, index) => index === 0 ? word : capitalize(word)).join(''),
        pascal: pascalWords.join(''),
      }
    })
}

function createNameStem(targetPath: string, contribution: MetadataTypeContribution): string {
  let stem = normalizePath(targetPath.trim()).replace(/^\.\//, '')
  const sourceRootIndex = stem.lastIndexOf(METADATA_SOURCE_ROOT)
  if (sourceRootIndex >= 0) {
    stem = stem.slice(sourceRootIndex + METADATA_SOURCE_ROOT.length)
  }
  if (contribution.fileSuffix && stem.endsWith(contribution.fileSuffix)) {
    return stem.slice(0, -contribution.fileSuffix.length)
  }
  if (contribution.fixedFileName && stem.endsWith(contribution.fixedFileName)) {
    return 'example'
  }
  return stem.replace(/\.json$/i, '')
}

function wordsFromSegment(segment: string): string[] {
  return segment
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[-_\s]+/)
    .map((word) => word.trim())
    .filter(Boolean)
}

function capitalize(value: string): string {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value
}

function getPathValue(target: unknown, path: string[]): unknown {
  let current = target
  for (const segment of path) {
    if (Array.isArray(current)) {
      current = current[Number(segment)]
    } else if (isRecord(current)) {
      current = current[segment]
    } else {
      return undefined
    }
  }
  return current
}

function setPathValue(target: unknown, path: string[], value: unknown): void {
  if (!path.length) {
    return
  }
  let current = target
  for (const segment of path.slice(0, -1)) {
    if (Array.isArray(current)) {
      current = current[Number(segment)]
    } else if (isRecord(current)) {
      current = current[segment]
    } else {
      return
    }
  }
  const lastSegment = path[path.length - 1]
  if (Array.isArray(current)) {
    current[Number(lastSegment)] = value
  } else if (isRecord(current)) {
    current[lastSegment] = value
  }
}

function cloneValue<TValue>(value: TValue): TValue {
  return value === undefined ? value : JSON.parse(JSON.stringify(value)) as TValue
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
