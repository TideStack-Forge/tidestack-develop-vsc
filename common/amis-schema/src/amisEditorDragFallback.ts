import type { EditorManager } from 'amis-editor-core'

const rendererItemSelector = '.ae-RendererList-item[data-dnd-id]'
const dropRegionSelector = '[data-region][data-region-host]'
const defaultDragThreshold = 4

export interface AmisEditorFallbackPoint {
  clientX: number
  clientY: number
}

export interface AmisEditorFallbackDropTarget {
  id: string
  region: string
}

export interface AmisEditorDragFallbackOptions {
  root: HTMLElement
  manager: EditorManager
  enabled?: boolean | 'auto'
  onError?: (error: unknown) => void
}

interface ElementLike {
  closest(selector: string): ElementLike | null
  getAttribute(name: string): string | null
  setAttribute?: (name: string, value: string) => void
  removeAttribute?: (name: string) => void
  textContent?: string | null
}

interface DragState {
  rendererId: string
  source: ElementLike
  sourceDraggable: string | null
  start: AmisEditorFallbackPoint
  dragging: boolean
  dropTarget?: AmisEditorFallbackDropTarget
  ghost?: HTMLElement
}

interface AmisEditorHostWindow {
  navigator?: Pick<Navigator, 'userAgent'>
  cefQuery?: unknown
}

export function hasExceededAmisEditorFallbackDragThreshold(
  start: AmisEditorFallbackPoint,
  current: AmisEditorFallbackPoint,
  threshold = defaultDragThreshold,
): boolean {
  return Math.hypot(current.clientX - start.clientX, current.clientY - start.clientY) >= threshold
}

export function getAmisEditorFallbackRendererId(target: unknown): string | undefined {
  const item = getClosestElement(target, rendererItemSelector) ?? getClosestElement(target, '[data-dnd-id]')
  const rendererId = item?.getAttribute('data-dnd-id')?.trim()
  return rendererId || undefined
}

export function getAmisEditorFallbackDropTarget(target: unknown): AmisEditorFallbackDropTarget | undefined {
  const region = getClosestElement(target, dropRegionSelector)
  const id = region?.getAttribute('data-region-host')?.trim()
  const regionName = region?.getAttribute('data-region')?.trim()
  return id && regionName ? { id, region: regionName } : undefined
}

export function shouldUseAmisEditorDragFallback(win: AmisEditorHostWindow = window): boolean {
  if (typeof win.cefQuery === 'function') {
    return true
  }
  const userAgent = typeof win.navigator?.userAgent === 'string' ? win.navigator.userAgent : ''
  return /\bJCEF\b|JetBrains|IntelliJ/i.test(userAgent)
}

export function installAmisEditorDragFallback(options: AmisEditorDragFallbackOptions): () => void {
  const ownerDocument = options.root.ownerDocument
  const ownerWindow = ownerDocument.defaultView
  const enabled = options.enabled === true || (options.enabled !== false && ownerWindow && shouldUseAmisEditorDragFallback(ownerWindow))
  if (!enabled || !ownerWindow) {
    return () => undefined
  }
  const browserWindow = ownerWindow

  let state: DragState | undefined
  let suppressClick = false
  const dragDocuments = new Set<Document>()

  const onMouseDown = (event: MouseEvent): void => {
    if (event.button !== 0 || state) {
      return
    }
    const source = getClosestElement(event.target, rendererItemSelector)
    const rendererId = getAmisEditorFallbackRendererId(source)
    if (!source || !rendererId) {
      return
    }

    const sourceDraggable = source.getAttribute('draggable')
    source.setAttribute?.('draggable', 'false')
    state = {
      rendererId,
      source,
      sourceDraggable,
      start: toPoint(event),
      dragging: false,
    }
    installDragDocumentListeners()
  }

  const onMouseMove = (event: MouseEvent): void => {
    if (!state) {
      return
    }
    const point = toPoint(event)
    if (!state.dragging && !hasExceededAmisEditorFallbackDragThreshold(state.start, point)) {
      return
    }

    state.dragging = true
    event.preventDefault()
    event.stopPropagation()
    ownerDocument.body.classList.add('ouroboros-amis-editor-fallback-dragging')
    ownerDocument.body.style.userSelect = 'none'
    state.ghost = state.ghost ?? createGhost(ownerDocument, state.source.textContent || state.rendererId)
    moveGhost(state.ghost, point)
    updateDropTarget(event)
  }

  const onMouseUp = (event: MouseEvent): void => {
    if (!state) {
      return
    }
    const currentState = state
    if (currentState.dragging) {
      event.preventDefault()
      event.stopPropagation()
      suppressNextClick()
      const dropTarget = resolveDropTargetFromPoint(event) ?? currentState.dropTarget
      if (dropTarget) {
        insertRenderer(options.manager, currentState.rendererId, dropTarget, options.onError)
      }
    }
    cleanupDragState()
  }

  const onNativeDragStart = (event: DragEvent): void => {
    if (getAmisEditorFallbackRendererId(event.target)) {
      event.preventDefault()
      event.stopImmediatePropagation()
    }
  }

  const onClick = (event: MouseEvent): void => {
    if (!suppressClick) {
      return
    }
    event.preventDefault()
    event.stopImmediatePropagation()
    suppressClick = false
  }

  function installDragDocumentListeners(): void {
    addDragDocument(ownerDocument)
    ownerDocument.querySelectorAll('iframe').forEach((frame) => {
      try {
        if (frame.contentDocument) {
          addDragDocument(frame.contentDocument)
        }
      } catch {
        // Ignore cross-origin frames; AMIS editor preview frames are same-origin.
      }
    })
  }

  function addDragDocument(doc: Document): void {
    if (dragDocuments.has(doc)) {
      return
    }
    dragDocuments.add(doc)
    doc.addEventListener('mousemove', onMouseMove, true)
    doc.addEventListener('mouseup', onMouseUp, true)
  }

  function removeDragDocumentListeners(): void {
    dragDocuments.forEach((doc) => {
      doc.removeEventListener('mousemove', onMouseMove, true)
      doc.removeEventListener('mouseup', onMouseUp, true)
    })
    dragDocuments.clear()
  }

  function updateDropTarget(event: MouseEvent): void {
    const dropTarget = resolveDropTargetFromPoint(event)
    state!.dropTarget = dropTarget
    setDropTarget(options.manager, dropTarget)
  }

  function cleanupDragState(): void {
    if (state?.sourceDraggable === null) {
      state.source.removeAttribute?.('draggable')
    } else if (state) {
      state.source.setAttribute?.('draggable', state.sourceDraggable)
    }
    state?.ghost?.remove()
    state = undefined
    setDropTarget(options.manager, undefined)
    removeDragDocumentListeners()
    ownerDocument.body.classList.remove('ouroboros-amis-editor-fallback-dragging')
    ownerDocument.body.style.userSelect = ''
  }

  function suppressNextClick(): void {
    suppressClick = true
    browserWindow.setTimeout(() => {
      suppressClick = false
    }, 0)
  }

  function dispose(): void {
    cleanupDragState()
    ownerDocument.removeEventListener('mousedown', onMouseDown, true)
    ownerDocument.removeEventListener('dragstart', onNativeDragStart, true)
    ownerDocument.removeEventListener('click', onClick, true)
  }

  ownerDocument.addEventListener('mousedown', onMouseDown, true)
  ownerDocument.addEventListener('dragstart', onNativeDragStart, true)
  ownerDocument.addEventListener('click', onClick, true)
  return dispose
}

function getClosestElement(target: unknown, selector: string): ElementLike | null {
  if (!isElementLike(target)) {
    return null
  }
  return target.closest(selector)
}

function isElementLike(value: unknown): value is ElementLike {
  return Boolean(value) && typeof (value as ElementLike).closest === 'function' && typeof (value as ElementLike).getAttribute === 'function'
}

function toPoint(event: MouseEvent): AmisEditorFallbackPoint {
  return { clientX: event.clientX, clientY: event.clientY }
}

function resolveDropTargetFromPoint(event: MouseEvent): AmisEditorFallbackDropTarget | undefined {
  const doc = getEventDocument(event)
  const element = elementFromPointDeep(doc, event.clientX, event.clientY)
  return getAmisEditorFallbackDropTarget(element ?? event.target)
}

function getEventDocument(event: MouseEvent): Document {
  const target = event.target as { ownerDocument?: Document } | null
  return target?.ownerDocument ?? document
}

function elementFromPointDeep(doc: Document, clientX: number, clientY: number): Element | null {
  const element = doc.elementFromPoint(clientX, clientY)
  const frameWindow = doc.defaultView
  const iframeType = frameWindow?.HTMLIFrameElement
  if (!element || !iframeType || !(element instanceof iframeType)) {
    return element
  }
  try {
    const frameDocument = element.contentDocument
    if (!frameDocument) {
      return element
    }
    const rect = element.getBoundingClientRect()
    return elementFromPointDeep(frameDocument, clientX - rect.left, clientY - rect.top) ?? element
  } catch {
    return element
  }
}

function createGhost(doc: Document, label: string): HTMLElement {
  const ghost = doc.createElement('div')
  ghost.textContent = label.trim() || 'Component'
  ghost.style.position = 'fixed'
  ghost.style.zIndex = '2147483647'
  ghost.style.pointerEvents = 'none'
  ghost.style.maxWidth = '220px'
  ghost.style.padding = '6px 10px'
  ghost.style.border = '1px solid #c7cbd3'
  ghost.style.borderRadius = '4px'
  ghost.style.background = '#ffffff'
  ghost.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.18)'
  ghost.style.color = '#151b26'
  ghost.style.fontSize = '12px'
  ghost.style.whiteSpace = 'nowrap'
  ghost.style.overflow = 'hidden'
  ghost.style.textOverflow = 'ellipsis'
  doc.body.appendChild(ghost)
  return ghost
}

function moveGhost(ghost: HTMLElement, point: AmisEditorFallbackPoint): void {
  ghost.style.left = `${point.clientX + 12}px`
  ghost.style.top = `${point.clientY + 12}px`
}

function setDropTarget(manager: EditorManager, target: AmisEditorFallbackDropTarget | undefined): void {
  const setDropId = manager.store?.setDropId
  if (typeof setDropId === 'function') {
    setDropId(target?.id ?? '', target?.region ?? '')
  }
}

function insertRenderer(
  manager: EditorManager,
  rendererId: string,
  target: AmisEditorFallbackDropTarget,
  onError: ((error: unknown) => void) | undefined,
): void {
  try {
    manager.store?.setActiveId(target.id, target.region)
    Promise.resolve(manager.addElem(rendererId)).catch((error) => onError?.(error))
  } catch (error) {
    onError?.(error)
  }
}
