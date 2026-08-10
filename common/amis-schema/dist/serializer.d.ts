import type { MetadataDiagnostic, MetadataFileTemplateField, MetadataTypeContribution } from './types';
export interface ParsedMetadataDocument {
    value?: unknown;
    diagnostics: MetadataDiagnostic[];
}
export declare function parseMetadataJson(text: string): ParsedMetadataDocument;
export declare function serializeMetadataDocument(value: unknown, contribution?: MetadataTypeContribution): string;
export type MetadataFileTemplateValues = Record<string, unknown>;
export declare function serializeMetadataFileTemplate(contribution: MetadataTypeContribution, values?: MetadataFileTemplateValues): string;
export declare function applyMetadataFileTemplateValues(document: unknown, fields: MetadataFileTemplateField[], values: MetadataFileTemplateValues): unknown;
export declare function createMetadataFileTemplateDefaultValues(contribution: MetadataTypeContribution, targetPath: string): MetadataFileTemplateValues;
