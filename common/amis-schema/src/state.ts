import type { MetadataEditorDocument, MetadataEditorHost, MetadataEditorState } from './types'

export async function createMetadataEditorState(
  host: MetadataEditorHost,
  uri: string,
  expectedType: string,
): Promise<MetadataEditorState> {
  return createMetadataEditorStateFromDocument(host, uri, expectedType, await host.loadDocument(uri))
}

export async function createMetadataEditorStateFromDocument(
  host: MetadataEditorHost,
  uri: string,
  expectedType: string,
  document: MetadataEditorDocument,
): Promise<MetadataEditorState> {
  if (document.type !== expectedType) {
    return {
      document: {
        ...document,
        diagnostics: [
          ...document.diagnostics,
          {
            code: 'metadata-editor-type-mismatch',
            message: `This editor handles ${expectedType} metadata, but the file resolved as ${document.type ?? 'unsupported'} metadata.`,
            severity: 'error',
          },
        ],
      },
    }
  }

  const contribution = await host.getTypeContribution(expectedType)
  return {
    document,
    editorKind: contribution.editorKind,
    editorSchema: contribution.createEditorSchema({ uri, document: document.value }),
    documentShape: contribution.documentShape,
  }
}
