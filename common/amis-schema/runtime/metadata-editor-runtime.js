(function (global) {
  var UI_SCHEMA_NAME_LABEL_REMARK = '按低代码页面命名习惯填写点分名称，例如 Admin.UserList；系统运行时会映射成 /admin/user-list。';

  function byId(id) {
    return global.document.getElementById(id);
  }

  function isRecord(value) {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  function normalizeDocument(value) {
    if (Array.isArray(value)) {
      return value.map(normalizeDocument);
    }
    if (!isRecord(value)) {
      return value;
    }
    return Object.keys(value)
      .reduce(function (result, key) {
        result[key] = normalizeDocument(value[key]);
        return result;
      }, {});
  }

  function serializeDocument(value) {
    var serialized = JSON.stringify(normalizeDocument(value), null, 2);
    return (serialized === undefined ? '' : serialized) + '\n';
  }

  function formatDiagnostics(items) {
    if (!items || !items.length) {
      return '';
    }
    return items
      .map(function (item) {
        return item.severity + ': ' + item.code + ' - ' + item.message;
      })
      .join('\n');
  }

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function normalizeEditorSchema(schema) {
    var next = clone(schema);
    if (isRecord(next) && next.type === 'form' && next.actions === undefined) {
      next.actions = [];
    }
    if (isRecord(next) && next.type === 'form' && next.title === undefined) {
      next.title = false;
    }
    return next;
  }

  function extractValueFromAmisChange(args) {
    var first = args[0];
    var second = args[1];
    var third = args[2];
    if (isRecord(first) && isRecord(second) && isRecord(third)) {
      return first;
    }
    if (typeof second === 'string') {
      var next = {};
      next[second] = first;
      return next;
    }
    if (isRecord(first) && isRecord(first.data)) {
      return first.data;
    }
    if (isRecord(first) && isRecord(first.values)) {
      return first.values;
    }
    if (isRecord(first)) {
      return first;
    }
    if (isRecord(third)) {
      return third;
    }
    return undefined;
  }

  function getAmisEmbed() {
    if (!global.amisRequire) {
      return undefined;
    }
    var module = global.amisRequire('amis/embed');
    if (module && typeof module.embed === 'function') {
      return module.embed;
    }
    if (typeof module === 'function') {
      return module;
    }
    if (module && module.default && typeof module.default.embed === 'function') {
      return module.default.embed;
    }
    return undefined;
  }

  function normalizeTheme(theme) {
    return theme === 'dark' ? 'dark' : 'cxd';
  }

  function normalizeThemeForEditorKind(theme, editorKind) {
    return editorKind === 'amis-editor' ? 'cxd' : normalizeTheme(theme);
  }

  function normalizeLocale(locale) {
    return typeof locale === 'string' && locale.trim() ? locale.replace('_', '-') : 'zh-CN';
  }

  function hasOwn(value, key) {
    return Object.prototype.hasOwnProperty.call(value, key);
  }

  function isDocumentContainer(value) {
    return Array.isArray(value) || isRecord(value);
  }

  function isUiSchemaWrapper(value) {
    return isRecord(value) && isRecord(value.schema);
  }

  function shouldEditWrappedUiSchema(state) {
    return state.editorKind === 'amis-editor' && state.documentShape !== 'array' && isUiSchemaWrapper(state.currentValue);
  }

  function getVisualEditorValue(state) {
    return shouldEditWrappedUiSchema(state) ? state.currentValue.schema : state.currentValue;
  }

  function getUiSchemaWrapperFields(state) {
    if (!shouldEditWrappedUiSchema(state)) {
      return undefined;
    }
    return {
      name: typeof state.currentValue.name === 'string' ? state.currentValue.name : '',
      title: typeof state.currentValue.title === 'string' ? state.currentValue.title : '',
      description: typeof state.currentValue.description === 'string' ? state.currentValue.description : '',
    };
  }

  function mergePreservingKeyOrder(current, patch) {
    if (Array.isArray(current) && Array.isArray(patch)) {
      return patch.map(function (item, index) {
        return mergePreservingKeyOrder(current[index], item);
      });
    }
    if (!isRecord(current) || !isRecord(patch)) {
      return normalizeDocument(patch);
    }
    var next = {};
    Object.keys(current).forEach(function (key) {
      next[key] = hasOwn(patch, key) ? mergePreservingKeyOrder(current[key], patch[key]) : normalizeDocument(current[key]);
    });
    Object.keys(patch).forEach(function (key) {
      if (!hasOwn(current, key)) {
        next[key] = normalizeDocument(patch[key]);
      }
    });
    return next;
  }

  function valuesEqual(left, right) {
    if (left === right) {
      return true;
    }
    if (Array.isArray(left) && Array.isArray(right)) {
      return left.length === right.length && left.every(function (value, index) {
        return valuesEqual(value, right[index]);
      });
    }
    if (isRecord(left) && isRecord(right)) {
      var leftKeys = Object.keys(left);
      var rightKeys = Object.keys(right);
      return leftKeys.length === rightKeys.length && leftKeys.every(function (key) {
        return hasOwn(right, key) && valuesEqual(left[key], right[key]);
      });
    }
    return false;
  }

  function createValuePatch(base, current) {
    var operations = [];

    function collect(before, after, path, arrayContexts) {
      if (valuesEqual(before, after)) {
        return;
      }
      if (Array.isArray(before) && Array.isArray(after)) {
        var nextArrayContexts = arrayContexts.concat({
          path: path.slice(),
          expected: normalizeDocument(before),
        });
        var commonLength = Math.min(before.length, after.length);
        for (var index = 0; index < commonLength; index += 1) {
          collect(before[index], after[index], path.concat(index), nextArrayContexts);
        }
        for (var removedIndex = before.length - 1; removedIndex >= after.length; removedIndex -= 1) {
          operations.push({
            kind: 'delete',
            path: path.concat(removedIndex),
            expected: normalizeDocument(before[removedIndex]),
            expectsExisting: true,
            arrayContexts: nextArrayContexts,
          });
        }
        for (var addedIndex = before.length; addedIndex < after.length; addedIndex += 1) {
          operations.push({
            kind: 'set',
            path: path.concat(addedIndex),
            value: normalizeDocument(after[addedIndex]),
            expectsExisting: false,
            arrayContexts: nextArrayContexts,
          });
        }
        return;
      }
      if (isRecord(before) && isRecord(after)) {
        Object.keys(before).forEach(function (key) {
          if (!hasOwn(after, key)) {
            operations.push({
              kind: 'delete',
              path: path.concat(key),
              expected: normalizeDocument(before[key]),
              expectsExisting: true,
              arrayContexts: arrayContexts,
            });
          }
        });
        Object.keys(after).forEach(function (key) {
          if (hasOwn(before, key)) {
            collect(before[key], after[key], path.concat(key), arrayContexts);
          } else {
            operations.push({
              kind: 'set',
              path: path.concat(key),
              value: normalizeDocument(after[key]),
              expectsExisting: false,
              arrayContexts: arrayContexts,
            });
          }
        });
        return;
      }
      operations.push({
        kind: 'set',
        path: path.slice(),
        value: normalizeDocument(after),
        expected: normalizeDocument(before),
        expectsExisting: true,
        arrayContexts: arrayContexts,
      });
    }

    collect(base, current, [], []);
    return operations;
  }

  function valueAtPath(value, path) {
    var current = value;
    for (var index = 0; index < path.length; index += 1) {
      if (current === undefined || current === null || !hasOwn(current, path[index])) {
        return undefined;
      }
      current = current[path[index]];
    }
    return current;
  }

  function applyValuePatch(base, operations) {
    var result = normalizeDocument(base);
    var snapshot = normalizeDocument(base);
    var conflict = false;
    (operations || []).forEach(function (operation) {
      if (conflict) {
        return;
      }
      if (!operation.path.length) {
        if (!valuesEqual(result, operation.expected)) {
          conflict = true;
          return;
        }
        result = operation.kind === 'delete' ? undefined : normalizeDocument(operation.value);
        return;
      }
      if ((operation.arrayContexts || []).some(function (context) {
        return !valuesEqual(valueAtPath(snapshot, context.path), context.expected);
      })) {
        conflict = true;
        return;
      }
      var parent = result;
      for (var index = 0; index < operation.path.length - 1; index += 1) {
        if (parent === undefined || parent === null || (!isRecord(parent) && !Array.isArray(parent))) {
          conflict = true;
          return;
        }
        parent = parent[operation.path[index]];
      }
      if (parent === undefined || parent === null || (!isRecord(parent) && !Array.isArray(parent))) {
        conflict = true;
        return;
      }
      var key = operation.path[operation.path.length - 1];
      var indexKey = Array.isArray(parent) ? Number(key) : key;
      if (Array.isArray(parent) && (!Number.isInteger(indexKey) || indexKey < 0 || indexKey > parent.length)) {
        conflict = true;
        return;
      }
      var exists = Array.isArray(parent)
        ? Number.isInteger(indexKey) && indexKey >= 0 && indexKey < parent.length && hasOwn(parent, indexKey)
        : hasOwn(parent, key);
      if (exists !== operation.expectsExisting) {
        conflict = true;
        return;
      }
      if (operation.kind === 'delete') {
        if (Array.isArray(parent)) {
          parent.splice(indexKey, 1);
        } else {
          delete parent[key];
        }
      } else if (Array.isArray(parent) && indexKey === parent.length) {
        parent.push(normalizeDocument(operation.value));
      } else {
        parent[indexKey] = normalizeDocument(operation.value);
      }
    });
    return conflict ? { conflict: true } : { value: result, conflict: false };
  }

  function mount(options) {
    var transport = options.transport || {};
    var state = {
      revision: '0',
      currentText: '',
      currentValue: undefined,
      baseValue: undefined,
      localPatch: [],
      editorSchema: undefined,
      editorKind: 'form',
      amisEditorApp: undefined,
      amisEditorMountRoot: undefined,
      amisEditorWrapperActive: undefined,
      uiSchemaWrapperInputs: undefined,
      uiSchemaWrapperFieldsRoot: undefined,
      uiSchemaWrapperToggle: undefined,
      uiSchemaWrapperCollapsed: false,
      theme: normalizeTheme(options.theme),
      locale: normalizeLocale(options.locale),
      dirty: false,
      pendingState: undefined,
      saveTimer: undefined,
      saving: false,
      queuedSave: false,
      lastSaveError: undefined,
      amisEditorDragFallback: options.amisEditorDragFallback,
    };
    var amisRoot = byId(options.amisRootId || 'metadata-amis-root');
    var diagnostics = byId(options.diagnosticsId || 'metadata-diagnostics');
    var dirty = byId(options.dirtyId || 'metadata-dirty');

    function applyThemeClass() {
      var isDark = state.theme === 'dark';
      var cxdLink = byId(options.cxdThemeLinkId || 'metadata-amis-theme-cxd');
      var darkLink = byId(options.darkThemeLinkId || 'metadata-amis-theme-dark');
      function setThemeLinkEnabled(link, enabled) {
        if (!link) {
          return;
        }
        link.disabled = !enabled;
        link.media = enabled ? 'all' : 'not all';
        if (link.sheet) {
          link.sheet.disabled = !enabled;
        }
      }
      if (cxdLink) {
        setThemeLinkEnabled(cxdLink, !isDark);
      }
      if (darkLink) {
        setThemeLinkEnabled(darkLink, isDark);
      }
      if (global.document && global.document.body && global.document.body.classList) {
        global.document.body.classList.toggle('metadata-theme-dark', isDark);
        global.document.body.classList.toggle('metadata-theme-light', !isDark);
        global.document.body.classList.toggle('metadata-amis-editor-light', state.editorKind === 'amis-editor');
      }
    }

    function setTheme(theme) {
      var nextTheme = normalizeThemeForEditorKind(theme, state.editorKind);
      if (state.theme === nextTheme) {
        applyThemeClass();
        return;
      }
      state.theme = nextTheme;
      applyThemeClass();
      if (state.editorKind === 'amis-editor' && state.amisEditorApp) {
        state.amisEditorApp.setTheme(nextTheme);
        return;
      }
      renderAmisEditor();
    }

    function setDirty(value) {
      state.dirty = value;
      if (dirty) {
        dirty.textContent = value ? 'Unsaved changes' : '';
      }
    }

    function setDiagnostics(items) {
      if (diagnostics) {
        var message = formatDiagnostics(items || []);
        diagnostics.textContent = message;
        diagnostics.hidden = !message;
      }
    }

    function setConflict(nextState) {
      state.pendingState = nextState;
      setDiagnostics([
        {
          severity: 'warning',
          code: 'revision-conflict',
          message: 'Document changed outside this editor. Local unsaved changes were kept.',
        },
      ]);
    }

    function clearConflict() {
      state.pendingState = undefined;
    }

    function clearSaveTimer() {
      if (state.saveTimer && typeof global.clearTimeout === 'function') {
        global.clearTimeout(state.saveTimer);
      }
      state.saveTimer = undefined;
    }

    function applySavedState(nextState, savedText) {
      if (!nextState || !nextState.document) {
        return;
      }
      state.revision = nextState.document.revision || state.revision;
      if (nextState.editorSchema) {
        state.editorSchema = nextState.editorSchema;
      }
      state.editorKind = nextState.editorKind || state.editorKind || 'form';
      state.theme = normalizeThemeForEditorKind(state.theme, state.editorKind);
      applyThemeClass();
      setDiagnostics(nextState.document.diagnostics || []);
      if (state.currentText === savedText || state.currentText === (nextState.document.text || '')) {
        state.currentText = nextState.document.text || savedText;
        state.currentValue = nextState.document.value;
        state.baseValue = clone(nextState.document.value);
        state.localPatch = [];
        state.lastSaveError = undefined;
        setDirty(false);
        clearConflict();
      } else {
        state.baseValue = clone(nextState.document.value);
        state.localPatch = createValuePatch(state.baseValue, state.currentValue);
        setDirty(true);
      }
    }

    function rebaseConflict(nextState) {
      if (!nextState || !nextState.document) {
        setDiagnostics([{ severity: 'error', code: 'revision-conflict', message: 'Unable to load the latest document state.' }]);
        return;
      }
      var externalValue = nextState.document.value;
      if (!isDocumentContainer(externalValue)) {
        setDiagnostics([
          {
            severity: 'error',
            code: 'revision-conflict-manual',
            message: 'The latest external document is not a JSON object. Local form changes were kept for manual reconciliation.',
          },
        ]);
        return;
      }
      var patchResult = applyValuePatch(externalValue, state.localPatch);
      if (patchResult.conflict) {
        setDiagnostics([
          {
            severity: 'error',
            code: 'revision-conflict-manual',
            message: 'The latest external document changed the structure used by local form changes. Local changes were kept for manual reconciliation.',
          },
        ]);
        return;
      }
      var rebasedValue = patchResult.value;
      state.revision = nextState.document.revision || state.revision;
      state.baseValue = clone(externalValue);
      state.currentValue = rebasedValue;
      state.currentText = serializeDocument(state.currentValue);
      state.localPatch = createValuePatch(state.baseValue, state.currentValue);
      if (nextState.editorSchema) {
        state.editorSchema = nextState.editorSchema;
      }
      state.editorKind = nextState.editorKind || state.editorKind || 'form';
      state.theme = normalizeThemeForEditorKind(state.theme, state.editorKind);
      applyThemeClass();
      state.pendingState = undefined;
      state.queuedSave = false;
      renderAmisEditor();
      setDirty(true);
      setDiagnostics([
        {
          severity: 'warning',
          code: 'revision-conflict-rebased',
          message: 'External changes were loaded and local form changes will be saved again.',
        },
      ]);
      scheduleSave();
    }

    function recoverRevisionConflict(error) {
      var pendingState = state.pendingState;
      if (pendingState) {
        rebaseConflict(pendingState);
        return;
      }
      if (!transport.loadState) {
        state.lastSaveError = error;
        setDiagnostics([{ severity: 'error', code: 'revision-conflict', message: error && error.message ? error.message : String(error) }]);
        return;
      }
      Promise.resolve(transport.loadState()).then(function (nextState) {
        rebaseConflict(state.pendingState || nextState);
      }).catch(function (loadError) {
        state.lastSaveError = loadError;
        setDiagnostics([
          {
            severity: 'error',
            code: 'revision-conflict-reload',
            message: loadError && loadError.message ? loadError.message : String(loadError),
          },
        ]);
      });
    }

    function handleSaveError(error) {
      state.saving = false;
      if (error && error.code === 'revision-conflict') {
        recoverRevisionConflict(error);
        return true;
      }
      state.lastSaveError = error;
      setDiagnostics([{ severity: 'error', code: 'host-save', message: error && error.message ? error.message : String(error) }]);
      return false;
    }

    function flushSave() {
      clearSaveTimer();
      if (!transport.saveText || !state.dirty) {
        return;
      }
      if (state.saving) {
        state.queuedSave = true;
        return;
      }

      var savedText = state.currentText;
      var baseRevision = state.revision;
      var result;
      state.saving = true;
      state.queuedSave = false;
      state.lastSaveError = undefined;
      try {
        result = transport.saveText(savedText, baseRevision);
      } catch (error) {
        handleSaveError(error);
        return;
      }

      Promise.resolve(result).then(function (nextState) {
        state.saving = false;
        state.lastSaveError = undefined;
        applySavedState(nextState, savedText);
        if (state.queuedSave || state.currentText !== savedText) {
          scheduleSave();
        }
      }).catch(function (error) {
        var recoveringConflict = handleSaveError(error);
        if (!recoveringConflict && state.queuedSave) {
          scheduleSave();
        }
      });
    }

    function scheduleSave() {
      if (!transport.saveText) {
        return;
      }
      clearSaveTimer();
      var delay = typeof options.saveDelayMs === 'number' ? options.saveDelayMs : 200;
      if (delay <= 0 || typeof global.setTimeout !== 'function') {
        flushSave();
        return;
      }
      state.saveTimer = global.setTimeout(flushSave, delay);
    }

    function flushPendingChanges() {
      if (!transport.saveText) {
        return Promise.resolve();
      }
      clearSaveTimer();
      flushSave();
      return new Promise(function (resolve, reject) {
        var startedAt = Date.now();
        var timeoutMs = typeof options.flushTimeoutMs === 'number' ? options.flushTimeoutMs : 10000;

        function waitForSave() {
          if (!state.dirty && !state.saving && !state.saveTimer && !state.queuedSave) {
            resolve();
            return;
          }
          if (state.lastSaveError && !state.saving && !state.saveTimer) {
            reject(state.lastSaveError);
            return;
          }
          if (!state.saving && !state.saveTimer && state.dirty) {
            flushSave();
          }
          if (timeoutMs >= 0 && Date.now() - startedAt > timeoutMs) {
            reject(new Error('Timed out while flushing pending metadata editor changes.'));
            return;
          }
          if (typeof global.setTimeout === 'function') {
            global.setTimeout(waitForSave, 10);
          } else {
            Promise.resolve().then(waitForSave);
          }
        }

        waitForSave();
      });
    }

    function applyEditorValue(value) {
      if (value === undefined) {
        return;
      }
      if (shouldEditWrappedUiSchema(state)) {
        state.currentValue = mergePreservingKeyOrder(state.currentValue, { schema: value });
      } else if (state.documentShape === 'array') {
        var nextArray = Array.isArray(value)
          ? value
          : isRecord(value) && hasOwn(value, 'items')
            ? value.items
            : undefined;
        if (!Array.isArray(nextArray)) {
          return;
        }
        state.currentValue = mergePreservingKeyOrder(Array.isArray(state.currentValue) ? state.currentValue : [], nextArray);
      } else {
        state.currentValue = mergePreservingKeyOrder(isRecord(state.currentValue) ? state.currentValue : {}, value);
      }
      state.currentText = serializeDocument(state.currentValue);
      state.localPatch = createValuePatch(state.baseValue, state.currentValue);
      state.lastSaveError = undefined;
      setDirty(true);
      scheduleSave();
    }

    function applyUiSchemaWrapperFields(fields) {
      if (!shouldEditWrappedUiSchema(state) || !isRecord(fields)) {
        return;
      }
      var patch = {};
      ['name', 'title', 'description'].forEach(function (key) {
        if (typeof fields[key] === 'string') {
          patch[key] = fields[key];
        }
      });
      state.currentValue = mergePreservingKeyOrder(state.currentValue, patch);
      state.currentText = serializeDocument(state.currentValue);
      state.localPatch = createValuePatch(state.baseValue, state.currentValue);
      state.lastSaveError = undefined;
      setDirty(true);
      scheduleSave();
    }

    function createUiSchemaWrapperField(field) {
      var wrapper = global.document.createElement('label');
      var label = global.document.createElement('span');
      var input = global.document.createElement(field.multiline ? 'textarea' : 'input');
      wrapper.className = 'metadata-ui-schema-wrapper-field';
      label.className = 'metadata-ui-schema-wrapper-label';
      label.textContent = field.label;
      if (field.labelRemark) {
        var labelRemark = global.document.createElement('span');
        labelRemark.className = 'metadata-ui-schema-wrapper-label-remark';
        labelRemark.textContent = '?';
        labelRemark.setAttribute('title', field.labelRemark);
        labelRemark.setAttribute('aria-label', field.labelRemark);
        label.appendChild(labelRemark);
      }
      input.className = 'metadata-ui-schema-wrapper-input';
      input.setAttribute('name', field.name);
      if (!field.multiline) {
        input.setAttribute('type', 'text');
      }
      input.addEventListener('input', function () {
        var nextFields = {};
        nextFields[field.name] = input.value;
        applyUiSchemaWrapperFields(nextFields);
      });
      wrapper.appendChild(label);
      wrapper.appendChild(input);
      return { wrapper: wrapper, input: input };
    }

    function updateUiSchemaWrapperFields() {
      var inputs = state.uiSchemaWrapperInputs;
      var fields = getUiSchemaWrapperFields(state);
      if (!inputs || !fields) {
        return;
      }
      Object.keys(inputs).forEach(function (key) {
        if (inputs[key].value !== fields[key]) {
          inputs[key].value = fields[key];
        }
      });
      updateUiSchemaWrapperCollapsedState();
    }

    function updateUiSchemaWrapperCollapsedState() {
      if (state.uiSchemaWrapperFieldsRoot) {
        state.uiSchemaWrapperFieldsRoot.className = 'metadata-ui-schema-wrapper-fields' + (state.uiSchemaWrapperCollapsed ? ' is-collapsed' : '');
      }
      if (state.uiSchemaWrapperToggle) {
        state.uiSchemaWrapperToggle.className = 'metadata-ui-schema-wrapper-toggle' + (state.uiSchemaWrapperCollapsed ? ' is-collapsed' : '');
        state.uiSchemaWrapperToggle.setAttribute('aria-expanded', state.uiSchemaWrapperCollapsed ? 'false' : 'true');
        state.uiSchemaWrapperToggle.textContent = state.uiSchemaWrapperCollapsed ? '展开页面信息' : '收起页面信息';
      }
    }

    function setUiSchemaWrapperCollapsed(collapsed) {
      state.uiSchemaWrapperCollapsed = Boolean(collapsed);
      updateUiSchemaWrapperCollapsedState();
    }

    function createUiSchemaWrapperHeader() {
      var header = global.document.createElement('div');
      var title = global.document.createElement('span');
      var toggle = global.document.createElement('button');
      header.className = 'metadata-ui-schema-wrapper-header';
      title.className = 'metadata-ui-schema-wrapper-title';
      title.textContent = '页面信息';
      toggle.setAttribute('type', 'button');
      toggle.addEventListener('click', function () {
        setUiSchemaWrapperCollapsed(!state.uiSchemaWrapperCollapsed);
      });
      header.appendChild(title);
      header.appendChild(toggle);
      state.uiSchemaWrapperToggle = toggle;
      updateUiSchemaWrapperCollapsedState();
      return header;
    }

    function ensureAmisEditorMountRoot(wrapped) {
      if (state.amisEditorApp && state.amisEditorWrapperActive !== wrapped) {
        state.amisEditorApp.dispose();
        state.amisEditorApp = undefined;
        state.amisEditorMountRoot = undefined;
        state.uiSchemaWrapperInputs = undefined;
        state.uiSchemaWrapperFieldsRoot = undefined;
        state.uiSchemaWrapperToggle = undefined;
      }
      if (state.amisEditorApp && state.amisEditorMountRoot) {
        updateUiSchemaWrapperFields();
        return state.amisEditorMountRoot;
      }
      state.amisEditorWrapperActive = wrapped;
      state.uiSchemaWrapperInputs = undefined;
      state.uiSchemaWrapperFieldsRoot = undefined;
      state.uiSchemaWrapperToggle = undefined;
      amisRoot.innerHTML = '';
      if (!wrapped || !global.document || typeof global.document.createElement !== 'function') {
        state.amisEditorMountRoot = amisRoot;
        return state.amisEditorMountRoot;
      }
      var shell = global.document.createElement('div');
      var fieldsRoot = global.document.createElement('div');
      var editorRoot = global.document.createElement('div');
      var inputs = {};
      shell.className = 'metadata-ui-schema-editor-shell';
      fieldsRoot.className = 'metadata-ui-schema-wrapper-fields';
      editorRoot.className = 'metadata-ui-schema-editor-canvas';
      [
        { name: 'name', label: '名称', labelRemark: UI_SCHEMA_NAME_LABEL_REMARK },
        { name: 'title', label: '标题' },
        { name: 'description', label: '描述', multiline: true },
      ].forEach(function (field) {
        var result = createUiSchemaWrapperField(field);
        inputs[field.name] = result.input;
        fieldsRoot.appendChild(result.wrapper);
      });
      shell.appendChild(createUiSchemaWrapperHeader());
      shell.appendChild(fieldsRoot);
      shell.appendChild(editorRoot);
      amisRoot.appendChild(shell);
      state.uiSchemaWrapperInputs = inputs;
      state.uiSchemaWrapperFieldsRoot = fieldsRoot;
      state.amisEditorMountRoot = editorRoot;
      updateUiSchemaWrapperFields();
      return editorRoot;
    }

    function renderAmisEditor() {
      if (!amisRoot) {
        return;
      }
      if (amisRoot.classList) {
        amisRoot.classList.toggle('metadata-amis-editor-active', state.editorKind === 'amis-editor');
      }
      if (state.editorKind === 'amis-editor') {
        var amisEditorRuntime = global.OuroborosAmisEditorRuntime;
        if (!amisEditorRuntime || typeof amisEditorRuntime.mount !== 'function') {
          amisRoot.textContent = 'AMIS visual editor runtime failed to load.';
          return;
        }
        try {
          var wrappedUiSchema = shouldEditWrappedUiSchema(state);
          var editorRoot = ensureAmisEditorMountRoot(wrappedUiSchema);
          var editorState = {
            value: getVisualEditorValue(state),
            theme: state.theme,
            locale: state.locale,
          };
          if (!state.amisEditorApp) {
            state.amisEditorApp = amisEditorRuntime.mount({
              root: editorRoot,
              value: editorState.value,
              theme: editorState.theme,
              locale: editorState.locale,
              dragFallback: state.amisEditorDragFallback,
              onChange: applyEditorValue,
              onError: function (error) {
                setDiagnostics([
                  {
                    severity: 'error',
                    code: 'amis-editor-render',
                    message: error && error.message ? error.message : String(error),
                  },
                ]);
              },
            });
          } else {
            updateUiSchemaWrapperFields();
            state.amisEditorApp.applyState(editorState);
          }
        } catch (error) {
          amisRoot.textContent = 'Unable to render AMIS visual editor.';
          setDiagnostics([
            {
              severity: 'error',
              code: 'amis-editor-render',
              message: error && error.message ? error.message : String(error),
            },
          ]);
        }
        return;
      }
      if (state.amisEditorApp) {
        state.amisEditorApp.dispose();
        state.amisEditorApp = undefined;
        state.amisEditorMountRoot = undefined;
        state.amisEditorWrapperActive = undefined;
        state.uiSchemaWrapperInputs = undefined;
        state.uiSchemaWrapperFieldsRoot = undefined;
        state.uiSchemaWrapperToggle = undefined;
      }
      amisRoot.innerHTML = '';
      var embed = getAmisEmbed();
      if (!embed || !state.editorSchema) {
        amisRoot.textContent = 'Unsupported metadata file';
        return;
      }
      try {
        embed(
          amisRoot,
          normalizeEditorSchema(state.editorSchema),
          {
            data: state.documentShape === 'array'
              ? { items: Array.isArray(state.currentValue) ? state.currentValue : [] }
              : isRecord(state.currentValue) ? state.currentValue : {},
            locale: state.locale,
            onChange: function () {
              applyEditorValue(extractValueFromAmisChange(arguments));
            },
          },
          {
            theme: state.theme,
            locale: state.locale,
            notify: function () {},
            alert: function (message) {
              if (diagnostics) {
                diagnostics.textContent = String(message);
              }
            },
          },
        );
      } catch (error) {
        amisRoot.textContent = 'Unable to render metadata form.';
        setDiagnostics([
          {
            severity: 'error',
            code: 'amis-render',
            message: error && error.message ? error.message : String(error),
          },
        ]);
      }
    }

    function applyState(nextState, applyOptions) {
      if (!nextState || !nextState.document) {
        return;
      }
      var incomingRevision = nextState.document.revision || '0';
      var incomingText = nextState.document.text || '';
      if (state.dirty && !(applyOptions && applyOptions.force) && incomingRevision !== state.revision && incomingText === state.currentText) {
        applySavedState(nextState, state.currentText);
        return;
      }
      if (state.dirty && !(applyOptions && applyOptions.force) && incomingRevision !== state.revision) {
        setConflict(nextState);
        return;
      }
      state.revision = nextState.document.revision || '0';
      state.currentText = incomingText;
      state.currentValue = nextState.document.value;
      state.baseValue = clone(nextState.document.value);
      state.localPatch = [];
      state.editorSchema = nextState.editorSchema;
      state.editorKind = nextState.editorKind || 'form';
      state.theme = normalizeThemeForEditorKind(state.theme, state.editorKind);
      applyThemeClass();
      state.documentShape = nextState.documentShape || (Array.isArray(nextState.document.value) ? 'array' : 'object');
      setDiagnostics(nextState.document.diagnostics || []);
      renderAmisEditor();
      setDirty(false);
      clearConflict();
    }

    if (options.initialState) {
      applyThemeClass();
      applyState(options.initialState);
    } else {
      applyThemeClass();
    }

    return {
      applyState: applyState,
      applyDiagnostics: setDiagnostics,
      applyEditorValue: applyEditorValue,
      flushPendingChanges: flushPendingChanges,
      setTheme: setTheme,
      getText: function () {
        return state.currentText;
      },
      getRevision: function () {
        return state.revision;
      },
      getTheme: function () {
        return state.theme;
      },
      getLocale: function () {
        return state.locale;
      },
    };
  }

  global.OuroborosMetadataEditorRuntime = {
    mount: mount,
    serializeDocument: serializeDocument,
    extractValueFromAmisChange: function () {
      return extractValueFromAmisChange(arguments);
    },
    __test__: {
      normalizeDocument: normalizeDocument,
      serializeDocument: serializeDocument,
      extractValueFromAmisChange: extractValueFromAmisChange,
      mergePreservingKeyOrder: mergePreservingKeyOrder,
      createValuePatch: createValuePatch,
      applyValuePatch: applyValuePatch,
      normalizeEditorSchema: normalizeEditorSchema,
      normalizeTheme: normalizeTheme,
      normalizeLocale: normalizeLocale,
      isUiSchemaWrapper: isUiSchemaWrapper,
      getVisualEditorValue: getVisualEditorValue,
      getUiSchemaWrapperFields: getUiSchemaWrapperFields,
    },
  };
})(window);
