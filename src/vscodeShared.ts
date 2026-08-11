import * as vscode from 'vscode'
import {
  normalizeIdeLocale,
  tideStackText,
  type JsonObject,
} from 'ouroboros-metadata-editor'

export function normalizeCommandUri(value: unknown): vscode.Uri | undefined {
  return value instanceof vscode.Uri ? value : undefined
}

export function currentIdeLocale(): 'zh-CN' | 'en-US' {
  return normalizeIdeLocale(vscode.env.language)
}

export function text(key: string, data?: Record<string, unknown>): string {
  return tideStackText(key, currentIdeLocale(), data)
}

export async function fileExists(uri: vscode.Uri): Promise<boolean> {
  return vscode.workspace.fs.stat(uri).then(() => true, () => false)
}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/')
}

export function trimSlashes(path: string): string {
  return path.replace(/^\/+|\/+$/g, '')
}

export function dirname(path: string): string | undefined {
  const normalizedPath = trimSlashes(normalizePath(path))
  const index = normalizedPath.lastIndexOf('/')
  return index > 0 ? normalizedPath.slice(0, index) : undefined
}

export function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function isFileNotFound(error: unknown): boolean {
  if (error instanceof vscode.FileSystemError) {
    return error.code === 'FileNotFound'
  }
  return error instanceof Error && /FileNotFound|ENOENT/.test(error.message)
}
