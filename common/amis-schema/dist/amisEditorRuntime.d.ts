import 'amis-editor-core/lib/style.css';
import './ouroborosAmisEditorPreset.js';
export interface AmisEditorRuntimeState {
    value: unknown;
    theme: string;
    locale: string;
}
export interface AmisEditorRuntimeOptions extends AmisEditorRuntimeState {
    root: HTMLElement;
    onChange: (value: unknown) => void;
    onError?: (error: unknown) => void;
    dragFallback?: boolean | 'auto';
}
export interface AmisEditorRuntimeApp {
    applyState(state: AmisEditorRuntimeState): void;
    setTheme(theme: string): void;
    dispose(): void;
}
declare global {
    interface Window {
        OuroborosAmisEditorRuntime?: {
            mount: typeof mountAmisEditor;
        };
    }
}
export declare function mountAmisEditor(options: AmisEditorRuntimeOptions): AmisEditorRuntimeApp;
declare const runtime: {
    mount: typeof mountAmisEditor;
};
export declare const mount: typeof mountAmisEditor;
export type AmisEditorRuntime = typeof runtime;
export {};
