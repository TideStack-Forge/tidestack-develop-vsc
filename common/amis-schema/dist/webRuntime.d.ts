export interface MetadataEditorWebviewHtmlOptions {
    template: string;
    fileName: string;
    nonce?: string;
    cspSource?: string;
    amisSdkScriptUri: string;
    amisSdkCssUri: string;
    amisThemeCssUri: string;
    amisDarkThemeCssUri: string;
    amisEditorRuntimeScriptUri?: string;
    amisEditorCssUri?: string;
    runtimeScriptUri: string;
    hostRuntimeScriptUri?: string;
    hostScript: string;
}
export declare const metadataEditorRuntimeFileName = "metadata-editor-runtime.js";
export declare const metadataEditorWebviewTemplateFileName = "metadata-editor-webview.html";
export declare function createMetadataEditorWebviewHtml(options: MetadataEditorWebviewHtmlOptions): string;
