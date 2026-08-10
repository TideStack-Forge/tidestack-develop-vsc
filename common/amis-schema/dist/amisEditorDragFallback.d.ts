import type { EditorManager } from 'amis-editor-core';
export interface AmisEditorFallbackPoint {
    clientX: number;
    clientY: number;
}
export interface AmisEditorFallbackDropTarget {
    id: string;
    region: string;
}
export interface AmisEditorDragFallbackOptions {
    root: HTMLElement;
    manager: EditorManager;
    enabled?: boolean | 'auto';
    onError?: (error: unknown) => void;
}
interface AmisEditorHostWindow {
    navigator?: Pick<Navigator, 'userAgent'>;
    cefQuery?: unknown;
}
export declare function hasExceededAmisEditorFallbackDragThreshold(start: AmisEditorFallbackPoint, current: AmisEditorFallbackPoint, threshold?: number): boolean;
export declare function getAmisEditorFallbackRendererId(target: unknown): string | undefined;
export declare function getAmisEditorFallbackDropTarget(target: unknown): AmisEditorFallbackDropTarget | undefined;
export declare function shouldUseAmisEditorDragFallback(win?: AmisEditorHostWindow): boolean;
export declare function installAmisEditorDragFallback(options: AmisEditorDragFallbackOptions): () => void;
export {};
