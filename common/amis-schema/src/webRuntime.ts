export interface MetadataEditorWebviewHtmlOptions {
  template: string
  fileName: string
  nonce?: string
  cspSource?: string
  amisSdkScriptUri: string
  amisSdkCssUri: string
  amisThemeCssUri: string
  amisDarkThemeCssUri: string
  amisEditorRuntimeScriptUri?: string
  amisEditorCssUri?: string
  runtimeScriptUri: string
  hostRuntimeScriptUri?: string
  hostScript: string
}

export const metadataEditorRuntimeFileName = 'metadata-editor-runtime.js'
export const metadataEditorWebviewTemplateFileName = 'metadata-editor-webview.html'

export function createMetadataEditorWebviewHtml(options: MetadataEditorWebviewHtmlOptions): string {
  const nonce = options.nonce ?? ''
  const cspSource = options.cspSource ?? 'self'
  const nonceAttribute = nonce ? ` nonce="${escapeHtml(nonce)}"` : ''
  const evalPolicy = options.amisEditorRuntimeScriptUri ? " 'unsafe-eval'" : ''
  const scriptPolicy = nonce ? `${cspSource} 'nonce-${escapeHtml(nonce)}'${evalPolicy}` : `${cspSource} 'unsafe-inline'${evalPolicy}`
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} data:; font-src ${cspSource} data:; style-src ${cspSource} 'unsafe-inline'; script-src ${scriptPolicy};">`
  const hostRuntimeScriptTag = options.hostRuntimeScriptUri
    ? `<script${nonceAttribute} src="${escapeHtml(options.hostRuntimeScriptUri)}"></script>`
    : ''
  const replacements: Record<string, string> = {
    '{{CSP_META}}': cspMeta,
    '{{NONCE_ATTRIBUTE}}': nonceAttribute,
    '{{AMIS_SDK_SCRIPT_URI}}': escapeHtml(options.amisSdkScriptUri),
    '{{AMIS_SDK_CSS_URI}}': escapeHtml(options.amisSdkCssUri),
    '{{AMIS_THEME_CSS_URI}}': escapeHtml(options.amisThemeCssUri),
    '{{AMIS_DARK_THEME_CSS_URI}}': escapeHtml(options.amisDarkThemeCssUri),
    '{{AMIS_EDITOR_CSS_LINK}}': options.amisEditorCssUri
      ? `<link rel="stylesheet" href="${escapeHtml(options.amisEditorCssUri)}" />`
      : '',
    '{{RUNTIME_SCRIPT_URI}}': escapeHtml(options.runtimeScriptUri),
    '{{AMIS_EDITOR_RUNTIME_SCRIPT_TAG}}': options.amisEditorRuntimeScriptUri
      ? `<script${nonceAttribute} src="${escapeHtml(options.amisEditorRuntimeScriptUri)}"></script>`
      : '',
    '{{HOST_RUNTIME_SCRIPT_TAG}}': hostRuntimeScriptTag,
    '{{HOST_SCRIPT}}': options.hostScript,
  }
  const html = Object.entries(replacements).reduce(
    (current, [token, value]) => current.replaceAll(token, value),
    options.template,
  )
  if (/\{\{[A-Z_]+\}\}/.test(html)) {
    throw new Error('Metadata editor webview template contains unresolved placeholders')
  }
  return html
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
