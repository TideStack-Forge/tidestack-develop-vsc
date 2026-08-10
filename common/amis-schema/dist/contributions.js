"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadataTypeContributions = void 0;
exports.getContributionByType = getContributionByType;
exports.getContributionBySuffix = getContributionBySuffix;
exports.getContributionByPackagedPath = getContributionByPackagedPath;
exports.mapMetadataSourcePath = mapMetadataSourcePath;
exports.mapMetadataPackagedResourcePath = mapMetadataPackagedResourcePath;
exports.normalizePath = normalizePath;
const metadataTypeContributions_json_1 = __importDefault(require("./metadataTypeContributions.json"));
const SOURCE_ROOT = 'src/main/metadata/';
const PACKAGED_RESOURCE_ROOT = 'resources/META-INF/ouroboros/';
const METADATA_RESOURCE_DIRECTORY = 'metadata/';
const FIXED_METADATA_FILE_TYPES = {
    'app-modules.json': 'app-module',
    'configuration.json': 'configuration',
    'configuration-groups.json': 'configuration-group',
};
const FIXED_METADATA_TYPES = new Set(Object.values(FIXED_METADATA_FILE_TYPES));
const contributionDefinitions = metadataTypeContributions_json_1.default.types;
exports.metadataTypeContributions = contributionDefinitions.map((definition) => ({
    type: definition.type,
    fileSuffix: definition.fileSuffix,
    fixedFileName: definition.fixedFileName,
    displayName: definition.displayName,
    sourcePathPatterns: [...definition.sourcePathPatterns],
    packagedPathPrefix: definition.packagedPathPrefix,
    packagedPathPatterns: [...(definition.packagedPathPatterns ?? [])],
    editorKind: definition.editorKind ?? definition.editorKinds[0] ?? 'form',
    editorKinds: [...definition.editorKinds],
    documentShape: definition.documentShape ?? 'object',
    jsonSchema: cloneObject(definition.jsonSchema),
    fileTemplate: definition.fileTemplate ? cloneValue(definition.fileTemplate) : undefined,
    createEditorSchema: () => cloneObject(definition.editorSchema),
    normalize: normalizeObject,
}));
function getContributionByType(type) {
    return exports.metadataTypeContributions.find((contribution) => contribution.type === type);
}
function getContributionBySuffix(uri) {
    const contribution = getRawContributionBySuffix(uri);
    return contribution && !FIXED_METADATA_TYPES.has(contribution.type) ? contribution : undefined;
}
function getContributionByPackagedPath(uri) {
    const relativePath = getPackagedResourceRelativePath(uri);
    if (!relativePath) {
        return undefined;
    }
    if (relativePath.startsWith(METADATA_RESOURCE_DIRECTORY)) {
        return getContributionByMetadataRelativePath(relativePath.slice(METADATA_RESOURCE_DIRECTORY.length));
    }
    return exports.metadataTypeContributions.find((contribution) => {
        const runtimeDirectory = contribution.packagedPathPrefix.replace('META-INF/ouroboros/', '');
        return contribution.packagedPathPatterns?.includes(relativePath) === true
            || relativePath.startsWith(`${runtimeDirectory}/`);
    });
}
function mapMetadataSourcePath(uri) {
    const normalizedPath = normalizePath(uri);
    const sourceRootIndex = normalizedPath.lastIndexOf(SOURCE_ROOT);
    const sourceRelativePath = sourceRootIndex >= 0 ? normalizedPath.slice(sourceRootIndex + SOURCE_ROOT.length) : undefined;
    const contribution = sourceRelativePath
        ? getContributionByMetadataRelativePath(sourceRelativePath)
        : getContributionBySuffix(normalizedPath);
    if (!contribution) {
        return undefined;
    }
    const relativePath = sourceRelativePath ?? normalizedPath.slice(normalizedPath.lastIndexOf('/') + 1);
    const diagnostics = [];
    return {
        type: contribution.type,
        sourcePath: normalizedPath,
        packagedPath: `META-INF/ouroboros/metadata/${relativePath}`,
        contribution,
        diagnostics,
    };
}
function mapMetadataPackagedResourcePath(uri) {
    const normalizedPath = normalizePath(uri);
    const relativePath = getPackagedResourceRelativePath(normalizedPath);
    if (!relativePath || !relativePath.endsWith('.json')) {
        return undefined;
    }
    const contribution = getContributionByPackagedPath(normalizedPath);
    if (!contribution) {
        return undefined;
    }
    const suffixContribution = getRawContributionBySuffix(normalizedPath);
    const diagnostics = [];
    if (suffixContribution && suffixContribution.type !== contribution.type) {
        diagnostics.push({
            code: 'metadata-path-suffix-conflict',
            message: `Packaged path ${contribution.packagedPathPrefix} resolves this file as ${contribution.type}, but suffix ${suffixContribution.fileSuffix} resolves it as ${suffixContribution.type}.`,
            severity: 'error',
            path: normalizedPath,
        });
    }
    return {
        type: contribution.type,
        sourcePath: normalizedPath,
        packagedPath: `META-INF/ouroboros/${relativePath}`,
        contribution,
        diagnostics,
    };
}
function normalizePath(path) {
    return path.replace(/\\/g, '/');
}
function getPackagedResourceRelativePath(path) {
    const normalizedPath = normalizePath(path);
    const resourceRootIndex = normalizedPath.lastIndexOf(PACKAGED_RESOURCE_ROOT);
    if (resourceRootIndex < 0) {
        return undefined;
    }
    return normalizedPath.slice(resourceRootIndex + PACKAGED_RESOURCE_ROOT.length);
}
function getContributionByMetadataRelativePath(relativePath) {
    const normalizedPath = normalizePath(relativePath);
    const fixedType = FIXED_METADATA_FILE_TYPES[normalizedPath];
    if (fixedType) {
        return getContributionByType(fixedType);
    }
    const contribution = getContributionBySuffix(normalizedPath);
    return contribution && !FIXED_METADATA_TYPES.has(contribution.type) ? contribution : undefined;
}
function getRawContributionBySuffix(uri) {
    return exports.metadataTypeContributions.find((contribution) => contribution.fileSuffix && uri.endsWith(contribution.fileSuffix));
}
function normalizeObject(document) {
    if (Array.isArray(document)) {
        return document.map((item) => normalizeObject(item));
    }
    if (!document || typeof document !== 'object') {
        return document;
    }
    return Object.fromEntries(Object.entries(document).map(([key, value]) => [key, normalizeObject(value)]));
}
function cloneObject(value) {
    return cloneValue(value);
}
function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
}
