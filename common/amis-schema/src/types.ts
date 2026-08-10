export type MetadataEditorKind = 'form' | 'tree' | 'table' | 'amis-editor'
export type MetadataDocumentShape = 'object' | 'array'

export type MetadataDiagnosticSeverity = 'error' | 'warning' | 'info'

export interface MetadataDiagnostic {
  code: string
  message: string
  severity: MetadataDiagnosticSeverity
  path?: string
}

export interface MetadataReference {
  kind: string
  value: string
}

export interface MetadataReferenceTarget {
  uri: string
  path?: string
}

export interface MetadataValidationContext {
  uri: string
  packagedPath?: string
}

export type MetadataFileTemplateFieldDefault = 'camel-name' | 'dot-name' | 'slash-path' | 'title'

export interface MetadataFileTemplateField {
  name: string
  label: string
  labelRemark?: string
  documentPath: string[]
  required?: boolean
  defaultFromPath?: MetadataFileTemplateFieldDefault
}

export interface MetadataFileTemplate {
  defaultFileName: string
  document: unknown
  fields?: MetadataFileTemplateField[]
}

export interface MetadataEditorContext<TDocument = unknown> {
  uri: string
  document: TDocument
}

export interface MetadataTypeContribution<TDocument = unknown> {
  type: string
  fileSuffix?: `.${string}.json`
  fixedFileName?: string
  displayName: string
  sourcePathPatterns: string[]
  packagedPathPrefix: `META-INF/ouroboros/${string}`
  packagedPathPatterns: string[]
  editorKind: MetadataEditorKind
  editorKinds: MetadataEditorKind[]
  documentShape: MetadataDocumentShape
  jsonSchema: Record<string, unknown>
  fileTemplate?: MetadataFileTemplate
  createEditorSchema(context: MetadataEditorContext<TDocument>): Record<string, unknown>
  normalize?(document: TDocument): TDocument
  collectReferences?(document: TDocument): MetadataReference[]
  validateSemantics?(document: TDocument, context: MetadataValidationContext): MetadataDiagnostic[]
}

export interface MetadataFileRef {
  uri: string
  type: string
  packagedPath: string
}

export interface MetadataFileChange {
  uri: string
  revision: string
}

export interface Disposable {
  dispose(): void
}

export interface MetadataEditorDocumentBridge {
  loadText(uri: string): Promise<{ text: string; revision: string }>
  saveText(uri: string, text: string, baseRevision: string): Promise<{ revision: string }>
  publishDiagnostics(uri: string, diagnostics: MetadataDiagnostic[]): Promise<void>
  openReference?(target: MetadataReferenceTarget): Promise<void>
}

export interface MetadataIdeFileBridge extends MetadataEditorDocumentBridge {
  watchText(uri: string, listener: (change: MetadataFileChange) => void): Disposable
  listMetadataFiles(root: string, pattern: string): Promise<MetadataFileRef[]>
  openReference(target: MetadataReferenceTarget): Promise<void>
}

export interface MetadataEditorRuntimeConfig {
  supportedTypes: string[]
}

export interface MetadataEditorDocument {
  uri: string
  text: string
  revision: string
  type?: string
  packagedPath?: string
  diagnostics: MetadataDiagnostic[]
  value?: unknown
}

export interface MetadataEditorState {
  document: MetadataEditorDocument
  editorKind?: MetadataEditorKind
  editorSchema?: Record<string, unknown>
  documentShape?: MetadataDocumentShape
}

export interface MetadataEditorHost {
  getRuntimeConfig(): Promise<MetadataEditorRuntimeConfig>
  getTypeContribution(typeOrUri: string): Promise<MetadataTypeContribution>
  loadDocument(uri: string): Promise<MetadataEditorDocument>
  applyChange(uri: string, nextText: string, baseRevision: string): Promise<MetadataEditorDocument>
  validateDocument(uri: string, text: string): Promise<MetadataDiagnostic[]>
  openReference(target: MetadataReferenceTarget): Promise<void>
}

export interface MetadataPathMapping {
  type: string
  sourcePath: string
  packagedPath: string
  contribution: MetadataTypeContribution
  diagnostics: MetadataDiagnostic[]
}
