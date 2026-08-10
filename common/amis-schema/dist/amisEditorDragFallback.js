"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasExceededAmisEditorFallbackDragThreshold = hasExceededAmisEditorFallbackDragThreshold;
exports.getAmisEditorFallbackRendererId = getAmisEditorFallbackRendererId;
exports.getAmisEditorFallbackDropTarget = getAmisEditorFallbackDropTarget;
exports.shouldUseAmisEditorDragFallback = shouldUseAmisEditorDragFallback;
exports.installAmisEditorDragFallback = installAmisEditorDragFallback;
const rendererItemSelector = '.ae-RendererList-item[data-dnd-id]';
const dropRegionSelector = '[data-region][data-region-host]';
const defaultDragThreshold = 4;
function hasExceededAmisEditorFallbackDragThreshold(start, current, threshold = defaultDragThreshold) {
    return Math.hypot(current.clientX - start.clientX, current.clientY - start.clientY) >= threshold;
}
function getAmisEditorFallbackRendererId(target) {
    const item = getClosestElement(target, rendererItemSelector) ?? getClosestElement(target, '[data-dnd-id]');
    const rendererId = item?.getAttribute('data-dnd-id')?.trim();
    return rendererId || undefined;
}
function getAmisEditorFallbackDropTarget(target) {
    const region = getClosestElement(target, dropRegionSelector);
    const id = region?.getAttribute('data-region-host')?.trim();
    const regionName = region?.getAttribute('data-region')?.trim();
    return id && regionName ? { id, region: regionName } : undefined;
}
function shouldUseAmisEditorDragFallback(win = window) {
    if (typeof win.cefQuery === 'function') {
        return true;
    }
    const userAgent = typeof win.navigator?.userAgent === 'string' ? win.navigator.userAgent : '';
    return /\bJCEF\b|JetBrains|IntelliJ/i.test(userAgent);
}
function installAmisEditorDragFallback(options) {
    const ownerDocument = options.root.ownerDocument;
    const ownerWindow = ownerDocument.defaultView;
    const enabled = options.enabled === true || (options.enabled !== false && ownerWindow && shouldUseAmisEditorDragFallback(ownerWindow));
    if (!enabled || !ownerWindow) {
        return () => undefined;
    }
    const browserWindow = ownerWindow;
    let state;
    let suppressClick = false;
    const dragDocuments = new Set();
    const onMouseDown = (event) => {
        if (event.button !== 0 || state) {
            return;
        }
        const source = getClosestElement(event.target, rendererItemSelector);
        const rendererId = getAmisEditorFallbackRendererId(source);
        if (!source || !rendererId) {
            return;
        }
        const sourceDraggable = source.getAttribute('draggable');
        source.setAttribute?.('draggable', 'false');
        state = {
            rendererId,
            source,
            sourceDraggable,
            start: toPoint(event),
            dragging: false,
        };
        installDragDocumentListeners();
    };
    const onMouseMove = (event) => {
        if (!state) {
            return;
        }
        const point = toPoint(event);
        if (!state.dragging && !hasExceededAmisEditorFallbackDragThreshold(state.start, point)) {
            return;
        }
        state.dragging = true;
        event.preventDefault();
        event.stopPropagation();
        ownerDocument.body.classList.add('ouroboros-amis-editor-fallback-dragging');
        ownerDocument.body.style.userSelect = 'none';
        state.ghost = state.ghost ?? createGhost(ownerDocument, state.source.textContent || state.rendererId);
        moveGhost(state.ghost, point);
        updateDropTarget(event);
    };
    const onMouseUp = (event) => {
        if (!state) {
            return;
        }
        const currentState = state;
        if (currentState.dragging) {
            event.preventDefault();
            event.stopPropagation();
            suppressNextClick();
            const dropTarget = resolveDropTargetFromPoint(event) ?? currentState.dropTarget;
            if (dropTarget) {
                insertRenderer(options.manager, currentState.rendererId, dropTarget, options.onError);
            }
        }
        cleanupDragState();
    };
    const onNativeDragStart = (event) => {
        if (getAmisEditorFallbackRendererId(event.target)) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }
    };
    const onClick = (event) => {
        if (!suppressClick) {
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
        suppressClick = false;
    };
    function installDragDocumentListeners() {
        addDragDocument(ownerDocument);
        ownerDocument.querySelectorAll('iframe').forEach((frame) => {
            try {
                if (frame.contentDocument) {
                    addDragDocument(frame.contentDocument);
                }
            }
            catch {
                // Ignore cross-origin frames; AMIS editor preview frames are same-origin.
            }
        });
    }
    function addDragDocument(doc) {
        if (dragDocuments.has(doc)) {
            return;
        }
        dragDocuments.add(doc);
        doc.addEventListener('mousemove', onMouseMove, true);
        doc.addEventListener('mouseup', onMouseUp, true);
    }
    function removeDragDocumentListeners() {
        dragDocuments.forEach((doc) => {
            doc.removeEventListener('mousemove', onMouseMove, true);
            doc.removeEventListener('mouseup', onMouseUp, true);
        });
        dragDocuments.clear();
    }
    function updateDropTarget(event) {
        const dropTarget = resolveDropTargetFromPoint(event);
        state.dropTarget = dropTarget;
        setDropTarget(options.manager, dropTarget);
    }
    function cleanupDragState() {
        if (state?.sourceDraggable === null) {
            state.source.removeAttribute?.('draggable');
        }
        else if (state) {
            state.source.setAttribute?.('draggable', state.sourceDraggable);
        }
        state?.ghost?.remove();
        state = undefined;
        setDropTarget(options.manager, undefined);
        removeDragDocumentListeners();
        ownerDocument.body.classList.remove('ouroboros-amis-editor-fallback-dragging');
        ownerDocument.body.style.userSelect = '';
    }
    function suppressNextClick() {
        suppressClick = true;
        browserWindow.setTimeout(() => {
            suppressClick = false;
        }, 0);
    }
    function dispose() {
        cleanupDragState();
        ownerDocument.removeEventListener('mousedown', onMouseDown, true);
        ownerDocument.removeEventListener('dragstart', onNativeDragStart, true);
        ownerDocument.removeEventListener('click', onClick, true);
    }
    ownerDocument.addEventListener('mousedown', onMouseDown, true);
    ownerDocument.addEventListener('dragstart', onNativeDragStart, true);
    ownerDocument.addEventListener('click', onClick, true);
    return dispose;
}
function getClosestElement(target, selector) {
    if (!isElementLike(target)) {
        return null;
    }
    return target.closest(selector);
}
function isElementLike(value) {
    return Boolean(value) && typeof value.closest === 'function' && typeof value.getAttribute === 'function';
}
function toPoint(event) {
    return { clientX: event.clientX, clientY: event.clientY };
}
function resolveDropTargetFromPoint(event) {
    const doc = getEventDocument(event);
    const element = elementFromPointDeep(doc, event.clientX, event.clientY);
    return getAmisEditorFallbackDropTarget(element ?? event.target);
}
function getEventDocument(event) {
    const target = event.target;
    return target?.ownerDocument ?? document;
}
function elementFromPointDeep(doc, clientX, clientY) {
    const element = doc.elementFromPoint(clientX, clientY);
    const frameWindow = doc.defaultView;
    const iframeType = frameWindow?.HTMLIFrameElement;
    if (!element || !iframeType || !(element instanceof iframeType)) {
        return element;
    }
    try {
        const frameDocument = element.contentDocument;
        if (!frameDocument) {
            return element;
        }
        const rect = element.getBoundingClientRect();
        return elementFromPointDeep(frameDocument, clientX - rect.left, clientY - rect.top) ?? element;
    }
    catch {
        return element;
    }
}
function createGhost(doc, label) {
    const ghost = doc.createElement('div');
    ghost.textContent = label.trim() || 'Component';
    ghost.style.position = 'fixed';
    ghost.style.zIndex = '2147483647';
    ghost.style.pointerEvents = 'none';
    ghost.style.maxWidth = '220px';
    ghost.style.padding = '6px 10px';
    ghost.style.border = '1px solid #c7cbd3';
    ghost.style.borderRadius = '4px';
    ghost.style.background = '#ffffff';
    ghost.style.boxShadow = '0 4px 12px rgba(15, 23, 42, 0.18)';
    ghost.style.color = '#151b26';
    ghost.style.fontSize = '12px';
    ghost.style.whiteSpace = 'nowrap';
    ghost.style.overflow = 'hidden';
    ghost.style.textOverflow = 'ellipsis';
    doc.body.appendChild(ghost);
    return ghost;
}
function moveGhost(ghost, point) {
    ghost.style.left = `${point.clientX + 12}px`;
    ghost.style.top = `${point.clientY + 12}px`;
}
function setDropTarget(manager, target) {
    const setDropId = manager.store?.setDropId;
    if (typeof setDropId === 'function') {
        setDropId(target?.id ?? '', target?.region ?? '');
    }
}
function insertRenderer(manager, rendererId, target, onError) {
    try {
        manager.store?.setActiveId(target.id, target.region);
        Promise.resolve(manager.addElem(rendererId)).catch((error) => onError?.(error));
    }
    catch (error) {
        onError?.(error);
    }
}
