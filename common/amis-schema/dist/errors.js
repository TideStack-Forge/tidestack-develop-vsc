"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataRevisionConflictError = void 0;
exports.metadataHostErrorCode = metadataHostErrorCode;
class MetadataRevisionConflictError extends Error {
    code = 'revision-conflict';
    constructor(message) {
        super(message);
        this.name = 'MetadataRevisionConflictError';
    }
}
exports.MetadataRevisionConflictError = MetadataRevisionConflictError;
function metadataHostErrorCode(error) {
    if (error instanceof MetadataRevisionConflictError) {
        return error.code;
    }
    if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
        return error.code;
    }
    return 'host-error';
}
