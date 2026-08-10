"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mount = void 0;
exports.mountAmisEditor = mountAmisEditor;
const react_1 = __importDefault(require("react"));
const client_1 = require("react-dom/client");
const amis_editor_1 = require("amis-editor");
require("amis-editor-core/lib/style.css");
require("./ouroborosAmisEditorPreset.js");
const amisEditorDragFallback_1 = require("./amisEditorDragFallback");
const pureSchema_1 = require("./pureSchema");
function normalizeTheme(_theme) {
    return 'cxd';
}
function normalizeLocale(locale) {
    return locale.trim() || 'zh-CN';
}
function getModalContainer() {
    return document.body;
}
function renderEditor(state, onChange, lifecycle) {
    return react_1.default.createElement(amis_editor_1.Editor, {
        value: state.value,
        onChange: (schema) => onChange((0, pureSchema_1.getPureSchema)(schema)),
        theme: normalizeTheme(state.theme),
        appLocale: normalizeLocale(state.locale),
        autoFocus: true,
        className: 'ouroboros-amis-editor amis-scope',
        amisEnv: {
            notify: () => undefined,
            alert: () => undefined,
            confirm: () => Promise.resolve(true),
            getModalContainer,
        },
        onEditorMount: lifecycle.onEditorMount,
        onEditorUnmount: lifecycle.onEditorUnmount,
    });
}
function mountAmisEditor(options) {
    const reactRoot = (0, client_1.createRoot)(options.root);
    let state = {
        value: options.value,
        theme: normalizeTheme(options.theme),
        locale: normalizeLocale(options.locale),
    };
    let dragFallbackDispose;
    const lifecycle = {
        onEditorMount(manager) {
            dragFallbackDispose?.();
            dragFallbackDispose = (0, amisEditorDragFallback_1.installAmisEditorDragFallback)({
                root: options.root,
                manager,
                enabled: options.dragFallback,
                onError: options.onError,
            });
        },
        onEditorUnmount() {
            dragFallbackDispose?.();
            dragFallbackDispose = undefined;
        },
    };
    const render = () => {
        try {
            reactRoot.render(renderEditor(state, options.onChange, lifecycle));
        }
        catch (error) {
            options.onError?.(error);
        }
    };
    render();
    return {
        applyState(nextState) {
            state = {
                value: nextState.value,
                theme: normalizeTheme(nextState.theme),
                locale: normalizeLocale(nextState.locale),
            };
            render();
        },
        setTheme(theme) {
            state = { ...state, theme: normalizeTheme(theme) };
            render();
        },
        dispose() {
            dragFallbackDispose?.();
            dragFallbackDispose = undefined;
            reactRoot.unmount();
        },
    };
}
const runtime = { mount: mountAmisEditor };
exports.mount = mountAmisEditor;
if (typeof window !== 'undefined') {
    window.OuroborosAmisEditorRuntime = runtime;
}
