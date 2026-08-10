"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMetadataEditorState = createMetadataEditorState;
exports.createMetadataEditorStateFromDocument = createMetadataEditorStateFromDocument;
async function createMetadataEditorState(host, uri, expectedType) {
    return createMetadataEditorStateFromDocument(host, uri, expectedType, await host.loadDocument(uri));
}
async function createMetadataEditorStateFromDocument(host, uri, expectedType, document) {
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
        };
    }
    const contribution = await host.getTypeContribution(expectedType);
    return {
        document,
        editorKind: contribution.editorKind,
        editorSchema: contribution.createEditorSchema({ uri, document: document.value }),
        documentShape: contribution.documentShape,
    };
}
