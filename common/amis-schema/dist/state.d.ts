import type { MetadataEditorDocument, MetadataEditorHost, MetadataEditorState } from './types';
export declare function createMetadataEditorState(host: MetadataEditorHost, uri: string, expectedType: string): Promise<MetadataEditorState>;
export declare function createMetadataEditorStateFromDocument(host: MetadataEditorHost, uri: string, expectedType: string, document: MetadataEditorDocument): Promise<MetadataEditorState>;
