"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBrowserMetadataEditorHost = createBrowserMetadataEditorHost;
const host_1 = require("./host");
const errors_1 = require("./errors");
const state_1 = require("./state");
function createBrowserMetadataEditorHost(options) {
    let currentDocument = { ...options.initialDocument };
    const bridge = {
        async loadText() {
            return { ...currentDocument };
        },
        async saveText(_uri, text, baseRevision) {
            const saved = await options.saveText(text, baseRevision);
            if (currentDocument.revision !== baseRevision) {
                if (currentDocument.revision === saved.revision && currentDocument.text === text) {
                    return saved;
                }
                throw new errors_1.MetadataRevisionConflictError(`Metadata document changed while saving: expected ${baseRevision}, current ${currentDocument.revision}`);
            }
            currentDocument = { text, revision: saved.revision };
            return saved;
        },
        async publishDiagnostics(_uri, diagnostics) {
            await options.publishDiagnostics?.(diagnostics);
        },
    };
    const host = (0, host_1.createMetadataEditorHost)(bridge);
    return {
        async loadState() {
            return (0, state_1.createMetadataEditorState)(host, options.uri, options.metadataType);
        },
        async saveText(text, baseRevision) {
            const document = await host.applyChange(options.uri, text, baseRevision);
            return (0, state_1.createMetadataEditorStateFromDocument)(host, options.uri, options.metadataType, document);
        },
        async validate(text) {
            return host.validateDocument(options.uri, text);
        },
        async applyExternalDocument(document) {
            currentDocument = { ...document };
            return (0, state_1.createMetadataEditorState)(host, options.uri, options.metadataType);
        },
    };
}
