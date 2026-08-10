import type { Disposable, MetadataDiagnostic, MetadataEditorHost, MetadataFileChange, MetadataFileRef, MetadataIdeFileBridge, MetadataEditorDocumentBridge, MetadataReferenceTarget } from './types';
export declare class InMemoryMetadataFileBridge implements MetadataIdeFileBridge {
    private files;
    private listeners;
    private diagnostics;
    private openedReferences;
    constructor(initialFiles: Record<string, string>);
    loadText(uri: string): Promise<{
        text: string;
        revision: string;
    }>;
    saveText(uri: string, text: string, baseRevision: string): Promise<{
        revision: string;
    }>;
    watchText(uri: string, listener: (change: MetadataFileChange) => void): Disposable;
    listMetadataFiles(_root: string, _pattern: string): Promise<MetadataFileRef[]>;
    openReference(target: MetadataReferenceTarget): Promise<void>;
    publishDiagnostics(uri: string, diagnostics: MetadataDiagnostic[]): Promise<void>;
    getDiagnostics(uri: string): MetadataDiagnostic[];
    getOpenedReferences(): MetadataReferenceTarget[];
}
export declare function createMetadataEditorHost(fileBridge: MetadataEditorDocumentBridge): MetadataEditorHost;
