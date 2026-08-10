import {
  getContributionByPackagedPath,
  getContributionBySuffix,
  getContributionByType,
  mapMetadataPackagedResourcePath,
  mapMetadataSourcePath,
  metadataTypeContributions,
} from './contributions'
import { parseMetadataJson } from './serializer'
import { MetadataRevisionConflictError } from './errors'
import type {
  Disposable,
  MetadataDiagnostic,
  MetadataEditorDocument,
  MetadataEditorHost,
  MetadataFileChange,
  MetadataFileRef,
  MetadataIdeFileBridge,
  MetadataEditorDocumentBridge,
  MetadataReferenceTarget,
  MetadataTypeContribution,
} from './types'

export class InMemoryMetadataFileBridge implements MetadataIdeFileBridge {
  private files = new Map<string, { text: string; revision: number }>()
  private listeners = new Map<string, Set<(change: MetadataFileChange) => void>>()
  private diagnostics = new Map<string, MetadataDiagnostic[]>()
  private openedReferences: MetadataReferenceTarget[] = []

  constructor(initialFiles: Record<string, string>) {
    Object.entries(initialFiles).forEach(([uri, text]) => {
      this.files.set(uri, { text, revision: 1 })
    })
  }

  async loadText(uri: string): Promise<{ text: string; revision: string }> {
    const file = this.files.get(uri)
    if (!file) {
      return { text: '', revision: '0' }
    }
    return { text: file.text, revision: String(file.revision) }
  }

  async saveText(uri: string, text: string, baseRevision: string): Promise<{ revision: string }> {
    const current = this.files.get(uri)
    if (current && String(current.revision) !== baseRevision) {
      throw new MetadataRevisionConflictError(
        `Revision conflict for ${uri}: expected ${baseRevision}, actual ${current.revision}`,
      )
    }
    const nextRevision = (current?.revision ?? 0) + 1
    this.files.set(uri, { text, revision: nextRevision })
    this.listeners.get(uri)?.forEach((listener) => listener({ uri, revision: String(nextRevision) }))
    return { revision: String(nextRevision) }
  }

  watchText(uri: string, listener: (change: MetadataFileChange) => void): Disposable {
    const listeners = this.listeners.get(uri) ?? new Set<(change: MetadataFileChange) => void>()
    listeners.add(listener)
    this.listeners.set(uri, listeners)
    return {
      dispose: () => listeners.delete(listener),
    }
  }

  async listMetadataFiles(_root: string, _pattern: string): Promise<MetadataFileRef[]> {
    return Array.from(this.files.keys())
      .map((uri) => mapMetadataPackagedResourcePath(uri) ?? mapMetadataSourcePath(uri))
      .filter((mapping): mapping is NonNullable<typeof mapping> => Boolean(mapping))
      .map((mapping) => ({ uri: mapping.sourcePath, type: mapping.type, packagedPath: mapping.packagedPath }))
  }

  async openReference(target: MetadataReferenceTarget): Promise<void> {
    this.openedReferences.push(target)
  }

  async publishDiagnostics(uri: string, diagnostics: MetadataDiagnostic[]): Promise<void> {
    this.diagnostics.set(uri, diagnostics)
  }

  getDiagnostics(uri: string): MetadataDiagnostic[] {
    return this.diagnostics.get(uri) ?? []
  }

  getOpenedReferences(): MetadataReferenceTarget[] {
    return this.openedReferences
  }
}

export function createMetadataEditorHost(fileBridge: MetadataEditorDocumentBridge): MetadataEditorHost {
  function resolveDocumentType(uri: string): {
    type?: string
    packagedPath?: string
    contribution?: MetadataTypeContribution
    diagnostics: MetadataDiagnostic[]
  } {
    const mapping = mapMetadataPackagedResourcePath(uri) ?? mapMetadataSourcePath(uri)
    if (mapping) {
      return {
        type: mapping.type,
        packagedPath: mapping.packagedPath,
        contribution: mapping.contribution,
        diagnostics: mapping.diagnostics,
      }
    }

    const contribution = getContributionBySuffix(uri)
    if (!contribution) {
      return { diagnostics: [] }
    }

    return {
      type: contribution.type,
      contribution,
      diagnostics: [],
    }
  }

  async function validateDocument(uri: string, text: string): Promise<MetadataDiagnostic[]> {
    const documentType = resolveDocumentType(uri)
    const parsed = parseMetadataJson(text)
    const diagnostics = [...documentType.diagnostics, ...parsed.diagnostics]
    if (parsed.value !== undefined && documentType.contribution) {
      diagnostics.push(...validateJsonSchema(parsed.value, documentType.contribution.jsonSchema))
      if (documentType.contribution.validateSemantics) {
        diagnostics.push(
          ...documentType.contribution.validateSemantics(parsed.value, {
            uri,
            packagedPath: documentType.packagedPath,
          }),
        )
      }
    }
    await fileBridge.publishDiagnostics(uri, diagnostics)
    return diagnostics
  }

  async function toEditorDocument(uri: string, text: string, revision: string): Promise<MetadataEditorDocument> {
    const documentType = resolveDocumentType(uri)
    const parsed = parseMetadataJson(text)
    const diagnostics = await validateDocument(uri, text)
    return {
      uri,
      text,
      revision,
      type: documentType.type,
      packagedPath: documentType.packagedPath,
      diagnostics,
      value: parsed.value,
    }
  }

  return {
    async getRuntimeConfig() {
      return { supportedTypes: metadataTypeContributions.map((contribution) => contribution.type) }
    },
    async getTypeContribution(typeOrUri: string): Promise<MetadataTypeContribution> {
      const contribution = getContributionByType(typeOrUri) ?? getContributionByPackagedPath(typeOrUri) ?? getContributionBySuffix(typeOrUri)
      if (!contribution) {
        throw new Error(`Unsupported metadata type or URI: ${typeOrUri}`)
      }
      return contribution
    },
    async loadDocument(uri: string) {
      const file = await fileBridge.loadText(uri)
      return toEditorDocument(uri, file.text, file.revision)
    },
    async applyChange(uri: string, nextText: string, baseRevision: string) {
      const saved = await fileBridge.saveText(uri, nextText, baseRevision)
      return toEditorDocument(uri, nextText, saved.revision)
    },
    validateDocument,
    async openReference(target: MetadataReferenceTarget) {
      if (!fileBridge.openReference) {
        throw new Error('The metadata editor host does not support opening references')
      }
      await fileBridge.openReference(target)
    },
  }
}

function validateJsonSchema(document: unknown, schema: Record<string, unknown>): MetadataDiagnostic[] {
  return validateAgainstSchema(document, schema, '')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function validateAgainstSchema(value: unknown, schema: Record<string, unknown>, path: string): MetadataDiagnostic[] {
  const enumValues = Array.isArray(schema.enum) ? schema.enum : undefined
  if (enumValues && !enumValues.includes(value)) {
    return [enumDiagnostic(path, enumValues)]
  }
  if (schema.type === 'object') {
    if (!isRecord(value)) {
      return [typeDiagnostic(path, 'object')]
    }
    const diagnostics: MetadataDiagnostic[] = []
    const required = Array.isArray(schema.required) ? schema.required.filter((item): item is string => typeof item === 'string') : []
    const properties = isRecord(schema.properties) ? schema.properties : {}
    for (const name of required) {
      const nextPath = joinPath(path, name)
      if (!(name in value)) {
        diagnostics.push({
          code: 'schema-required-property',
          message: `Metadata document is missing required property '${nextPath}'.`,
          severity: 'error',
          path: nextPath,
        })
      }
    }
    for (const [name, propertySchema] of Object.entries(properties)) {
      if (name in value && isRecord(propertySchema)) {
        diagnostics.push(...validateAgainstSchema(value[name], propertySchema, joinPath(path, name)))
      }
    }
    return diagnostics
  }
  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      return [typeDiagnostic(path, 'array')]
    }
    const itemSchema = isRecord(schema.items) ? schema.items : undefined
    return itemSchema
      ? value.flatMap((item, index) => validateAgainstSchema(item, itemSchema, `${path}[${index}]`))
      : []
  }
  if (schema.type === 'string' && typeof value !== 'string') {
    return [typeDiagnostic(path, 'string')]
  }
  if (schema.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
    return [typeDiagnostic(path, 'number')]
  }
  if (schema.type === 'integer' && (typeof value !== 'number' || !Number.isInteger(value))) {
    return [typeDiagnostic(path, 'integer')]
  }
  if (schema.type === 'boolean' && typeof value !== 'boolean') {
    return [typeDiagnostic(path, 'boolean')]
  }
  return []
}

function typeDiagnostic(path: string, expectedType: string): MetadataDiagnostic {
  return {
    code: 'schema-property-type',
    message: path ? `Metadata property '${path}' must be a ${expectedType}.` : `Metadata document must be a ${expectedType}.`,
    severity: 'error',
    path: path || undefined,
  }
}

function enumDiagnostic(path: string, enumValues: unknown[]): MetadataDiagnostic {
  return {
    code: 'schema-enum-value',
    message: `Metadata property '${path}' must be one of: ${enumValues.join(', ')}.`,
    severity: 'error',
    path: path || undefined,
  }
}

function joinPath(prefix: string, name: string): string {
  return prefix ? `${prefix}.${name}` : name
}
