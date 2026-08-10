import type { MetadataDiagnostic, MetadataEditorState } from './types';
export interface BrowserMetadataDocument {
    text: string;
    revision: string;
}
export interface BrowserMetadataEditorHostOptions {
    uri: string;
    metadataType: string;
    initialDocument: BrowserMetadataDocument;
    saveText(text: string, baseRevision: string): Promise<{
        revision: string;
    }>;
    publishDiagnostics?(diagnostics: MetadataDiagnostic[]): Promise<void>;
}
export interface BrowserMetadataEditorHost {
    loadState(): Promise<MetadataEditorState>;
    saveText(text: string, baseRevision: string): Promise<MetadataEditorState>;
    validate(text: string): Promise<MetadataDiagnostic[]>;
    applyExternalDocument(document: BrowserMetadataDocument): Promise<MetadataEditorState>;
}
export declare function createBrowserMetadataEditorHost(options: BrowserMetadataEditorHostOptions): BrowserMetadataEditorHost;
