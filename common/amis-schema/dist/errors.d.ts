export declare class MetadataRevisionConflictError extends Error {
    readonly code = "revision-conflict";
    constructor(message: string);
}
export declare function metadataHostErrorCode(error: unknown): string;
