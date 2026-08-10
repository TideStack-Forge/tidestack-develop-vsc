"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryMetadataFileBridge = void 0;
exports.createMetadataEditorHost = createMetadataEditorHost;
const contributions_1 = require("./contributions");
const serializer_1 = require("./serializer");
const errors_1 = require("./errors");
class InMemoryMetadataFileBridge {
    files = new Map();
    listeners = new Map();
    diagnostics = new Map();
    openedReferences = [];
    constructor(initialFiles) {
        Object.entries(initialFiles).forEach(([uri, text]) => {
            this.files.set(uri, { text, revision: 1 });
        });
    }
    async loadText(uri) {
        const file = this.files.get(uri);
        if (!file) {
            return { text: '', revision: '0' };
        }
        return { text: file.text, revision: String(file.revision) };
    }
    async saveText(uri, text, baseRevision) {
        const current = this.files.get(uri);
        if (current && String(current.revision) !== baseRevision) {
            throw new errors_1.MetadataRevisionConflictError(`Revision conflict for ${uri}: expected ${baseRevision}, actual ${current.revision}`);
        }
        const nextRevision = (current?.revision ?? 0) + 1;
        this.files.set(uri, { text, revision: nextRevision });
        this.listeners.get(uri)?.forEach((listener) => listener({ uri, revision: String(nextRevision) }));
        return { revision: String(nextRevision) };
    }
    watchText(uri, listener) {
        const listeners = this.listeners.get(uri) ?? new Set();
        listeners.add(listener);
        this.listeners.set(uri, listeners);
        return {
            dispose: () => listeners.delete(listener),
        };
    }
    async listMetadataFiles(_root, _pattern) {
        return Array.from(this.files.keys())
            .map((uri) => (0, contributions_1.mapMetadataPackagedResourcePath)(uri) ?? (0, contributions_1.mapMetadataSourcePath)(uri))
            .filter((mapping) => Boolean(mapping))
            .map((mapping) => ({ uri: mapping.sourcePath, type: mapping.type, packagedPath: mapping.packagedPath }));
    }
    async openReference(target) {
        this.openedReferences.push(target);
    }
    async publishDiagnostics(uri, diagnostics) {
        this.diagnostics.set(uri, diagnostics);
    }
    getDiagnostics(uri) {
        return this.diagnostics.get(uri) ?? [];
    }
    getOpenedReferences() {
        return this.openedReferences;
    }
}
exports.InMemoryMetadataFileBridge = InMemoryMetadataFileBridge;
function createMetadataEditorHost(fileBridge) {
    function resolveDocumentType(uri) {
        const mapping = (0, contributions_1.mapMetadataPackagedResourcePath)(uri) ?? (0, contributions_1.mapMetadataSourcePath)(uri);
        if (mapping) {
            return {
                type: mapping.type,
                packagedPath: mapping.packagedPath,
                contribution: mapping.contribution,
                diagnostics: mapping.diagnostics,
            };
        }
        const contribution = (0, contributions_1.getContributionBySuffix)(uri);
        if (!contribution) {
            return { diagnostics: [] };
        }
        return {
            type: contribution.type,
            contribution,
            diagnostics: [],
        };
    }
    async function validateDocument(uri, text) {
        const documentType = resolveDocumentType(uri);
        const parsed = (0, serializer_1.parseMetadataJson)(text);
        const diagnostics = [...documentType.diagnostics, ...parsed.diagnostics];
        if (parsed.value !== undefined && documentType.contribution) {
            diagnostics.push(...validateJsonSchema(parsed.value, documentType.contribution.jsonSchema));
            if (documentType.contribution.validateSemantics) {
                diagnostics.push(...documentType.contribution.validateSemantics(parsed.value, {
                    uri,
                    packagedPath: documentType.packagedPath,
                }));
            }
        }
        await fileBridge.publishDiagnostics(uri, diagnostics);
        return diagnostics;
    }
    async function toEditorDocument(uri, text, revision) {
        const documentType = resolveDocumentType(uri);
        const parsed = (0, serializer_1.parseMetadataJson)(text);
        const diagnostics = await validateDocument(uri, text);
        return {
            uri,
            text,
            revision,
            type: documentType.type,
            packagedPath: documentType.packagedPath,
            diagnostics,
            value: parsed.value,
        };
    }
    return {
        async getRuntimeConfig() {
            return { supportedTypes: contributions_1.metadataTypeContributions.map((contribution) => contribution.type) };
        },
        async getTypeContribution(typeOrUri) {
            const contribution = (0, contributions_1.getContributionByType)(typeOrUri) ?? (0, contributions_1.getContributionByPackagedPath)(typeOrUri) ?? (0, contributions_1.getContributionBySuffix)(typeOrUri);
            if (!contribution) {
                throw new Error(`Unsupported metadata type or URI: ${typeOrUri}`);
            }
            return contribution;
        },
        async loadDocument(uri) {
            const file = await fileBridge.loadText(uri);
            return toEditorDocument(uri, file.text, file.revision);
        },
        async applyChange(uri, nextText, baseRevision) {
            const saved = await fileBridge.saveText(uri, nextText, baseRevision);
            return toEditorDocument(uri, nextText, saved.revision);
        },
        validateDocument,
        async openReference(target) {
            if (!fileBridge.openReference) {
                throw new Error('The metadata editor host does not support opening references');
            }
            await fileBridge.openReference(target);
        },
    };
}
function validateJsonSchema(document, schema) {
    return validateAgainstSchema(document, schema, '');
}
function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
function validateAgainstSchema(value, schema, path) {
    const enumValues = Array.isArray(schema.enum) ? schema.enum : undefined;
    if (enumValues && !enumValues.includes(value)) {
        return [enumDiagnostic(path, enumValues)];
    }
    if (schema.type === 'object') {
        if (!isRecord(value)) {
            return [typeDiagnostic(path, 'object')];
        }
        const diagnostics = [];
        const required = Array.isArray(schema.required) ? schema.required.filter((item) => typeof item === 'string') : [];
        const properties = isRecord(schema.properties) ? schema.properties : {};
        for (const name of required) {
            const nextPath = joinPath(path, name);
            if (!(name in value)) {
                diagnostics.push({
                    code: 'schema-required-property',
                    message: `Metadata document is missing required property '${nextPath}'.`,
                    severity: 'error',
                    path: nextPath,
                });
            }
        }
        for (const [name, propertySchema] of Object.entries(properties)) {
            if (name in value && isRecord(propertySchema)) {
                diagnostics.push(...validateAgainstSchema(value[name], propertySchema, joinPath(path, name)));
            }
        }
        return diagnostics;
    }
    if (schema.type === 'array') {
        if (!Array.isArray(value)) {
            return [typeDiagnostic(path, 'array')];
        }
        const itemSchema = isRecord(schema.items) ? schema.items : undefined;
        return itemSchema
            ? value.flatMap((item, index) => validateAgainstSchema(item, itemSchema, `${path}[${index}]`))
            : [];
    }
    if (schema.type === 'string' && typeof value !== 'string') {
        return [typeDiagnostic(path, 'string')];
    }
    if (schema.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
        return [typeDiagnostic(path, 'number')];
    }
    if (schema.type === 'integer' && (typeof value !== 'number' || !Number.isInteger(value))) {
        return [typeDiagnostic(path, 'integer')];
    }
    if (schema.type === 'boolean' && typeof value !== 'boolean') {
        return [typeDiagnostic(path, 'boolean')];
    }
    return [];
}
function typeDiagnostic(path, expectedType) {
    return {
        code: 'schema-property-type',
        message: path ? `Metadata property '${path}' must be a ${expectedType}.` : `Metadata document must be a ${expectedType}.`,
        severity: 'error',
        path: path || undefined,
    };
}
function enumDiagnostic(path, enumValues) {
    return {
        code: 'schema-enum-value',
        message: `Metadata property '${path}' must be one of: ${enumValues.join(', ')}.`,
        severity: 'error',
        path: path || undefined,
    };
}
function joinPath(prefix, name) {
    return prefix ? `${prefix}.${name}` : name;
}
