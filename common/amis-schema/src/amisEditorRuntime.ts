import React from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { type SchemaObject } from 'amis'
import { Editor } from 'amis-editor'
import 'amis-editor-core/lib/style.css'
import './ouroborosAmisEditorPreset.js'
import type { EditorManager } from 'amis-editor-core'
import { installAmisEditorDragFallback } from './amisEditorDragFallback'
import { getPureSchema } from './pureSchema'

export interface AmisEditorRuntimeState {
  value: unknown
  theme: string
  locale: string
}

export interface AmisEditorRuntimeOptions extends AmisEditorRuntimeState {
  root: HTMLElement
  onChange: (value: unknown) => void
  onError?: (error: unknown) => void
  dragFallback?: boolean | 'auto'
}

export interface AmisEditorRuntimeApp {
  applyState(state: AmisEditorRuntimeState): void
  setTheme(theme: string): void
  dispose(): void
}

declare global {
  interface Window {
    OuroborosAmisEditorRuntime?: {
      mount: typeof mountAmisEditor
    }
  }
}

function normalizeTheme(_theme: string): 'cxd' {
  return 'cxd'
}

function normalizeLocale(locale: string): string {
  return locale.trim() || 'zh-CN'
}

function getModalContainer(): HTMLElement {
  return document.body
}

interface AmisEditorLifecycleHandlers {
  onEditorMount: (manager: EditorManager) => void
  onEditorUnmount: (manager: EditorManager) => void
}

function renderEditor(
  state: AmisEditorRuntimeState,
  onChange: (value: unknown) => void,
  lifecycle: AmisEditorLifecycleHandlers,
): React.ReactElement {
  return React.createElement(Editor, {
    value: state.value as SchemaObject,
    onChange: (schema: unknown) => onChange(getPureSchema(schema)),
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
  })
}

export function mountAmisEditor(options: AmisEditorRuntimeOptions): AmisEditorRuntimeApp {
  const reactRoot: Root = createRoot(options.root)
  let state: AmisEditorRuntimeState = {
    value: options.value,
    theme: normalizeTheme(options.theme),
    locale: normalizeLocale(options.locale),
  }
  let dragFallbackDispose: (() => void) | undefined

  const lifecycle: AmisEditorLifecycleHandlers = {
    onEditorMount(manager) {
      dragFallbackDispose?.()
      dragFallbackDispose = installAmisEditorDragFallback({
        root: options.root,
        manager,
        enabled: options.dragFallback,
        onError: options.onError,
      })
    },
    onEditorUnmount() {
      dragFallbackDispose?.()
      dragFallbackDispose = undefined
    },
  }

  const render = (): void => {
    try {
      reactRoot.render(renderEditor(state, options.onChange, lifecycle))
    } catch (error) {
      options.onError?.(error)
    }
  }

  render()
  return {
    applyState(nextState) {
      state = {
        value: nextState.value,
        theme: normalizeTheme(nextState.theme),
        locale: normalizeLocale(nextState.locale),
      }
      render()
    },
    setTheme(theme) {
      state = { ...state, theme: normalizeTheme(theme) }
      render()
    },
    dispose() {
      dragFallbackDispose?.()
      dragFallbackDispose = undefined
      reactRoot.unmount()
    },
  }
}

const runtime = { mount: mountAmisEditor }

export const mount = mountAmisEditor

if (typeof window !== 'undefined') {
  window.OuroborosAmisEditorRuntime = runtime
}

export type AmisEditorRuntime = typeof runtime
