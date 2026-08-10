import { createMetadataEditorHost } from './host'
import { MetadataRevisionConflictError } from './errors'
import { createMetadataEditorState, createMetadataEditorStateFromDocument } from './state'
import type { MetadataDiagnostic, MetadataEditorDocumentBridge, MetadataEditorState } from './types'

export interface BrowserMetadataDocument {
  text: string
  revision: string
}

export interface BrowserMetadataEditorHostOptions {
  uri: string
  metadataType: string
  initialDocument: BrowserMetadataDocument
  saveText(text: string, baseRevision: string): Promise<{ revision: string }>
  publishDiagnostics?(diagnostics: MetadataDiagnostic[]): Promise<void>
}

export interface BrowserMetadataEditorHost {
  loadState(): Promise<MetadataEditorState>
  saveText(text: string, baseRevision: string): Promise<MetadataEditorState>
  validate(text: string): Promise<MetadataDiagnostic[]>
  applyExternalDocument(document: BrowserMetadataDocument): Promise<MetadataEditorState>
}

export function createBrowserMetadataEditorHost(options: BrowserMetadataEditorHostOptions): BrowserMetadataEditorHost {
  let currentDocument = { ...options.initialDocument }
  const bridge: MetadataEditorDocumentBridge = {
    async loadText() {
      return { ...currentDocument }
    },
    async saveText(_uri, text, baseRevision) {
      const saved = await options.saveText(text, baseRevision)
      if (currentDocument.revision !== baseRevision) {
        if (currentDocument.revision === saved.revision && currentDocument.text === text) {
          return saved
        }
        throw new MetadataRevisionConflictError(
          `Metadata document changed while saving: expected ${baseRevision}, current ${currentDocument.revision}`,
        )
      }
      currentDocument = { text, revision: saved.revision }
      return saved
    },
    async publishDiagnostics(_uri, diagnostics) {
      await options.publishDiagnostics?.(diagnostics)
    },
  }
  const host = createMetadataEditorHost(bridge)

  return {
    async loadState() {
      return createMetadataEditorState(host, options.uri, options.metadataType)
    },
    async saveText(text, baseRevision) {
      const document = await host.applyChange(options.uri, text, baseRevision)
      return createMetadataEditorStateFromDocument(host, options.uri, options.metadataType, document)
    },
    async validate(text) {
      return host.validateDocument(options.uri, text)
    },
    async applyExternalDocument(document) {
      currentDocument = { ...document }
      return createMetadataEditorState(host, options.uri, options.metadataType)
    },
  }
}
