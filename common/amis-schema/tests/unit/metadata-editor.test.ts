import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  InMemoryMetadataFileBridge,
  createMetadataFileTemplateDefaultValues,
  createBrowserMetadataEditorHost,
  createMetadataEditorWebviewHtml,
  createMetadataEditorHost,
  getContributionByType,
  getPureSchema,
  mapMetadataSourcePath,
  metadataTypeContributions,
  serializeMetadataDocument,
  serializeMetadataFileTemplate,
} from '../../src'
import {
  getAmisEditorFallbackDropTarget,
  getAmisEditorFallbackRendererId,
  hasExceededAmisEditorFallbackDragThreshold,
  shouldUseAmisEditorDragFallback,
} from '../../src/amisEditorDragFallback'

const metadataEditorWebviewTemplate = readFileSync(
  fileURLToPath(new URL('../../runtime/metadata-editor-webview.html', import.meta.url)),
  'utf8',
)

describe('metadata source path mapping', () => {
  it('maps MVP metadata files from src/main/metadata to META-INF/ouroboros', () => {
    const mappings = [
      mapMetadataSourcePath('/repo/src/main/metadata/user-management.authority.json'),
      mapMetadataSourcePath('/repo/src/main/metadata/system-setting.menu.json'),
      mapMetadataSourcePath('/repo/src/main/metadata/all-models.dev-menu.json'),
      mapMetadataSourcePath('/repo/src/main/metadata/system-setting.ui-model.json'),
      mapMetadataSourcePath('/repo/src/main/metadata/system-setting.ui-schema.json'),
      mapMetadataSourcePath('/repo/src/main/metadata/app-modules.json'),
      mapMetadataSourcePath('/repo/src/main/metadata/configuration.json'),
      mapMetadataSourcePath('/repo/src/main/metadata/configuration-groups.json'),
    ]

    expect(mappings.map((mapping) => mapping?.type)).toEqual([
      'authority',
      'menu',
      'dev-menu',
      'ui-model',
      'ui-schema',
      'app-module',
      'configuration',
      'configuration-group',
    ])
    expect(mappings.map((mapping) => mapping?.packagedPath)).toEqual([
      'META-INF/ouroboros/metadata/user-management.authority.json',
      'META-INF/ouroboros/metadata/system-setting.menu.json',
      'META-INF/ouroboros/metadata/all-models.dev-menu.json',
      'META-INF/ouroboros/metadata/system-setting.ui-model.json',
      'META-INF/ouroboros/metadata/system-setting.ui-schema.json',
      'META-INF/ouroboros/metadata/app-modules.json',
      'META-INF/ouroboros/metadata/configuration.json',
      'META-INF/ouroboros/metadata/configuration-groups.json',
    ])
    expect(mappings.flatMap((mapping) => mapping?.diagnostics ?? [])).toEqual([])
  })

  it('does not treat .menu-model.json as the MVP menu suffix', () => {
    expect(mapMetadataSourcePath('/repo/src/main/metadata/menu-model/main.menu-model.json')).toBeUndefined()
  })

  it('does not resolve fixed collection metadata by synthetic suffix files', () => {
    expect(mapMetadataSourcePath('/repo/src/main/metadata/app-module/home.app-module.json')).toBeUndefined()
    expect(mapMetadataSourcePath('/repo/src/main/metadata/configuration/home.configuration.json')).toBeUndefined()
    expect(mapMetadataSourcePath('/repo/src/main/metadata/configuration-group/home.configuration-group.json')).toBeUndefined()
  })

  it('resolves new metadata files by suffix even when the directory name differs', () => {
    const mapping = mapMetadataSourcePath('/repo/src/main/metadata/dev-menu-model/main.menu.json')

    expect(mapping?.type).toBe('menu')
    expect(mapping?.packagedPath).toBe('META-INF/ouroboros/metadata/dev-menu-model/main.menu.json')
    expect(mapping?.diagnostics).toEqual([])
  })

  it('matches new metadata suffixes without a source directory prefix', () => {
    expect(mapMetadataSourcePath('/repo/custom/ui-schema/home.ui-schema.json')).toMatchObject({
      type: 'ui-schema',
      packagedPath: 'META-INF/ouroboros/metadata/home.ui-schema.json',
      diagnostics: [],
    })
  })

  it('loads new packaged metadata by metadata directory suffixes and fixed file names', async () => {
    const menuUri = '/repo/core/sample/src/main/resources/META-INF/ouroboros/metadata/systemSetting/resourceManagement.menu.json'
    const uiSchemaUri = '/repo/core/sample/src/main/resources/META-INF/ouroboros/metadata/resourceManagement.ui-schema.json'
    const appModulesUri = '/repo/core/sample/src/main/resources/META-INF/ouroboros/metadata/app-modules.json'
    const configurationUri = '/repo/core/sample/src/main/resources/META-INF/ouroboros/metadata/configuration.json'
    const configurationGroupsUri = '/repo/core/sample/src/main/resources/META-INF/ouroboros/metadata/configuration-groups.json'
    const bridge = new InMemoryMetadataFileBridge({
      [menuUri]: '{"title":"Resource Management","fullName":"systemSetting.resourceManagement"}\n',
      [uiSchemaUri]: '{"name":"/resource-management","schema":{"type":"page","body":[]}}\n',
      [appModulesUri]: '[{"fullName":"resource","title":"Resource Management"}]\n',
      [configurationUri]: '[{"key":"resource.enabled","label":"Resource enabled","valueType":"boolean"}]\n',
      [configurationGroupsUri]: '[{"path":"resource","title":"Resource"}]\n',
    })
    const host = createMetadataEditorHost(bridge)

    await expect(host.loadDocument(menuUri)).resolves.toMatchObject({ type: 'menu', diagnostics: [] })
    await expect(host.loadDocument(uiSchemaUri)).resolves.toMatchObject({ type: 'ui-schema', diagnostics: [] })
    await expect(host.loadDocument(appModulesUri)).resolves.toMatchObject({ type: 'app-module', diagnostics: [] })
    await expect(host.loadDocument(configurationUri)).resolves.toMatchObject({ type: 'configuration', diagnostics: [] })
    await expect(host.loadDocument(configurationGroupsUri)).resolves.toMatchObject({ type: 'configuration-group', diagnostics: [] })
  })

  it('loads legacy packaged metadata by resources subpath without requiring the new suffix', async () => {
    const menuUri = '/repo/core/sample/src/main/resources/META-INF/ouroboros/menu-model/systemSetting/resourceManagement.json'
    const authorityUri = '/repo/core/sample/src/main/resources/META-INF/ouroboros/authority/systemSetting/resourceManagement.json'
    const devMenuUri = '/repo/core/sample/src/main/resources/META-INF/ouroboros/dev-menu-model/AllModels.Resource.json'
    const uiModelUri = '/repo/core/sample/src/main/resources/META-INF/ouroboros/ui-model/system-setting/resourceManagement.json'
    const uiSchemaUri = '/repo/core/sample/src/main/resources/META-INF/ouroboros/ui-schema/system-setting/resourceManagement.json'
    const appModulesUri = '/repo/core/sample/src/main/resources/META-INF/ouroboros/app-modules.json'
    const configurationUri = '/repo/core/sample/src/main/resources/META-INF/ouroboros/configuration.json'
    const configurationGroupsUri = '/repo/core/sample/src/main/resources/META-INF/ouroboros/configuration-groups.json'
    const bridge = new InMemoryMetadataFileBridge({
      [menuUri]: '{"title":"Resource Management","fullName":"systemSetting.resourceManagement"}\n',
      [authorityUri]: '{"title":"Resource Management","fullName":"systemSetting.resourceManagement"}\n',
      [devMenuUri]: '{"title":"Resource","fullName":"AllModels.Resource"}\n',
      [uiModelUri]: '{"path":"/resource-management","type":"amis","title":"Resource Management"}\n',
      [uiSchemaUri]: '{"type":"page","body":[],"customField":{"enabled":true}}\n',
      [appModulesUri]: '[{"fullName":"resource","title":"Resource Management"}]\n',
      [configurationUri]: '[{"key":"resource.enabled","label":"Resource enabled","valueType":"boolean"}]\n',
      [configurationGroupsUri]: '[{"path":"resource","title":"Resource"}]\n',
    })
    const host = createMetadataEditorHost(bridge)

    await expect(host.loadDocument(menuUri)).resolves.toMatchObject({
      type: 'menu',
      packagedPath: 'META-INF/ouroboros/menu-model/systemSetting/resourceManagement.json',
      diagnostics: [],
    })
    await expect(host.getTypeContribution(menuUri)).resolves.toMatchObject({ type: 'menu' })
    await expect(host.loadDocument(authorityUri)).resolves.toMatchObject({ type: 'authority', diagnostics: [] })
    await expect(host.loadDocument(devMenuUri)).resolves.toMatchObject({ type: 'dev-menu', diagnostics: [] })
    await expect(host.loadDocument(uiModelUri)).resolves.toMatchObject({ type: 'ui-model', diagnostics: [] })
    await expect(host.loadDocument(uiSchemaUri)).resolves.toMatchObject({ type: 'ui-schema', diagnostics: [] })
    await expect(host.loadDocument(appModulesUri)).resolves.toMatchObject({ type: 'app-module', diagnostics: [] })
    await expect(host.loadDocument(configurationUri)).resolves.toMatchObject({ type: 'configuration', diagnostics: [] })
    await expect(host.loadDocument(configurationGroupsUri)).resolves.toMatchObject({ type: 'configuration-group', diagnostics: [] })
  })

  it('diagnoses legacy packaged path and suffix conflicts', async () => {
    const uri = '/repo/src/main/resources/META-INF/ouroboros/dev-menu-model/main.menu.json'
    const bridge = new InMemoryMetadataFileBridge({
      [uri]: '{"title":"Main","fullName":"main"}\n',
    })
    const host = createMetadataEditorHost(bridge)

    const loaded = await host.loadDocument(uri)

    expect(loaded.type).toBe('dev-menu')
    expect(loaded.diagnostics).toEqual([
      expect.objectContaining({ code: 'metadata-path-suffix-conflict', severity: 'error' }),
    ])
  })

  it('diagnoses conflicts between a legacy metadata directory and a different suffix', async () => {
    const uri = '/repo/src/main/resources/META-INF/ouroboros/configuration-group/configuration-groups.menu.json'
    const bridge = new InMemoryMetadataFileBridge({ [uri]: '[]\n' })
    const host = createMetadataEditorHost(bridge)

    const loaded = await host.loadDocument(uri)

    expect(loaded.type).toBe('configuration-group')
    expect(loaded.diagnostics).toEqual([
      expect.objectContaining({ code: 'metadata-path-suffix-conflict', severity: 'error' }),
    ])
  })
})

describe('metadata type contributions', () => {
  it('registers all supported metadata types through one contribution contract', () => {
    expect(metadataTypeContributions.map((contribution) => contribution.type)).toEqual([
      'authority',
      'menu',
      'dev-menu',
      'ui-model',
      'ui-schema',
      'app-module',
      'configuration',
      'configuration-group',
    ])
    expect(metadataTypeContributions.slice(0, 3).map((contribution) => contribution.displayName)).toEqual(['权限项模型', '菜单模型', '开发菜单模型'])
    expect(metadataTypeContributions.slice(3).map((contribution) => contribution.displayName)).toEqual(['UI 模型', 'UI Schema', '应用模块', '配置项', '配置分组'])
    expect(getContributionByType('authority')?.editorKinds).toEqual(['form', 'table'])
    expect(getContributionByType('ui-schema')?.editorKinds).toEqual(['amis-editor'])
    expect(getContributionByType('menu')?.createEditorSchema({ uri: 'main.menu.json', document: {} })).toMatchObject({
      type: 'form',
      title: '菜单模型',
      actions: [],
    })
    expect(getContributionByType('authority')?.createEditorSchema({ uri: 'auth.authority.json', document: {} })).toMatchObject({
      title: '权限项模型',
    })
    expect(getContributionByType('dev-menu')?.createEditorSchema({ uri: 'dev.dev-menu.json', document: {} })).toMatchObject({
      title: '开发菜单模型',
    })
    expect(getContributionByType('ui-model')?.createEditorSchema({ uri: 'main.ui-model.json', document: {} })).toMatchObject({
      title: 'UI 模型',
    })
    expect(getContributionByType('ui-schema')?.createEditorSchema({ uri: 'main.ui-schema.json', document: {} })).toMatchObject({
      title: 'UI Schema',
    })
    expect(getContributionByType('app-module')?.createEditorSchema({ uri: 'app-modules.json', document: [] })).toMatchObject({
      title: '应用模块',
    })
    expect(getContributionByType('configuration')?.createEditorSchema({ uri: 'configuration.json', document: [] })).toMatchObject({
      title: '配置项',
    })
    expect(getContributionByType('configuration-group')?.createEditorSchema({ uri: 'configuration-groups.json', document: [] })).toMatchObject({
      title: '配置分组',
    })
    expect(getContributionByType('app-module')?.documentShape).toBe('array')
    expect(getContributionByType('configuration')?.documentShape).toBe('array')
    expect(getContributionByType('configuration-group')?.documentShape).toBe('array')
  })

  it('creates Chinese AMIS form labels and option labels by default', () => {
    const authoritySchema = getContributionByType('authority')?.createEditorSchema({ uri: 'auth.authority.json', document: {} }) as { body: Array<{ label?: string }> }
    const menuSchema = getContributionByType('menu')?.createEditorSchema({ uri: 'main.menu.json', document: {} }) as { body: Array<{ name?: string, label?: string, options?: unknown[] }> }
    const devMenuSchema = getContributionByType('dev-menu')?.createEditorSchema({ uri: 'dev.dev-menu.json', document: {} }) as { body: Array<{ name?: string, label?: string, options?: unknown[] }> }

    expect(authoritySchema.body.map((item) => item.label)).toEqual([
      '完整名称',
      '标题',
      '排序',
      '关联接口',
      '关联界面',
      '关联菜单',
    ])
    expect(menuSchema.body.map((item) => item.label)).toEqual([
      '完整名称',
      '标题',
      '访问路径',
      '图标',
      '位置',
      '显示方式',
      '排序',
    ])
    expect(menuSchema.body.find((item) => item.name === 'showMode')?.options).toEqual([
      { label: '标签页', value: 'tab' },
      { label: '全屏', value: 'fullScreen' },
      { label: '新窗口', value: 'newWindow' },
    ])
    expect(devMenuSchema.body.find((item) => item.name === 'stage')?.options).toEqual([
      { label: '欢迎页', value: 'welcome' },
      { label: '开发', value: 'dev' },
      { label: '全部', value: 'all' },
    ])
  })

  it('provides valid create-file templates for every metadata type', async () => {
    const expectedTemplateFiles = [
      'example.authority.json',
      'example.menu.json',
      'example.dev-menu.json',
      'example.ui-model.json',
      'example.ui-schema.json',
      'app-modules.json',
      'configuration.json',
      'configuration-groups.json',
    ]

    expect(metadataTypeContributions.map((contribution) => contribution.fileTemplate?.defaultFileName)).toEqual(expectedTemplateFiles)

    for (const contribution of metadataTypeContributions) {
      const uri = `/repo/src/main/metadata/${contribution.fileTemplate?.defaultFileName}`
      const templateText = serializeMetadataFileTemplate(contribution)
      const bridge = new InMemoryMetadataFileBridge({ [uri]: templateText })
      const host = createMetadataEditorHost(bridge)

      expect(mapMetadataSourcePath(uri)?.type).toBe(contribution.type)
      await expect(host.loadDocument(uri)).resolves.toMatchObject({
        type: contribution.type,
        diagnostics: [],
      })
    }
  })

  it('applies create-file field values through the shared template contract', () => {
    const uiSchema = getContributionByType('ui-schema')!
    const targetPath = 'src/main/metadata/admin/user-list.ui-schema.json'
    const nameField = uiSchema.fileTemplate?.fields?.find((field) => field.name === 'name')

    expect(nameField?.labelRemark).toBe('按低代码页面命名习惯填写点分名称，例如 Admin.UserList；系统运行时会映射成 /admin/user-list。')

    expect(createMetadataFileTemplateDefaultValues(uiSchema, targetPath)).toMatchObject({
      name: 'Admin.UserList',
      title: 'User List',
    })

    expect(JSON.parse(serializeMetadataFileTemplate(uiSchema, {
      name: 'Admin.UserList',
      title: '用户列表',
      description: '用户列表页面',
    }))).toEqual({
      name: 'Admin.UserList',
      title: '用户列表',
      description: '用户列表页面',
      schema: { type: 'page', body: [] },
    })
  })

  it('provides structured controls for the new metadata types', () => {
    const uiModelSchema = getContributionByType('ui-model')?.createEditorSchema({ uri: 'main.ui-model.json', document: {} }) as { body: Array<{ name?: string }> }
    const uiSchemaSchema = getContributionByType('ui-schema')?.createEditorSchema({ uri: 'main.ui-schema.json', document: {} }) as { body: Array<{ name?: string }> }
    const appModuleSchema = getContributionByType('app-module')?.createEditorSchema({ uri: 'app-modules.json', document: [] }) as { body: Array<{ name?: string }> }
    const configurationSchema = getContributionByType('configuration')?.createEditorSchema({ uri: 'configuration.json', document: [] }) as { body: Array<{ name?: string }> }
    const groupSchema = getContributionByType('configuration-group')?.createEditorSchema({ uri: 'configuration-groups.json', document: [] }) as { body: Array<{ name?: string }> }

    expect(uiModelSchema.body.map((item) => item.name)).toEqual(['path', 'type', 'title', 'icon', 'description'])
    expect(uiSchemaSchema.body.map((item) => item.name)).toContain('body')
    expect(appModuleSchema.body.map((item) => item.name)).toEqual(['items'])
    expect(configurationSchema.body.map((item) => item.name)).toEqual(['items'])
    expect(groupSchema.body.map((item) => item.name)).toEqual(['items'])
  })

  it('removes unused generated AMIS ids while keeping styled or referenced ids', () => {
    const schema = {
      type: 'page',
      id: 'u:page',
      body: [
        { type: 'input-text', id: 'u:unused', name: 'title' },
        { type: 'button', id: 'u:styled', themeCss: { baseControlClassName: { color: 'red' } } },
        { type: 'button', id: 'custom-id' },
        { type: 'container', id: 'u:referenced' },
        { type: 'action', componentId: 'u:referenced' },
      ],
      data: { id: 'u:data-id' },
    }

    expect(getPureSchema(schema)).toEqual({
      type: 'page',
      body: [
        { type: 'input-text', name: 'title' },
        { type: 'button', id: 'u:styled', themeCss: { baseControlClassName: { color: 'red' } } },
        { type: 'button', id: 'custom-id' },
        { type: 'container', id: 'u:referenced' },
        { type: 'action', componentId: 'u:referenced' },
      ],
      data: { id: 'u:data-id' },
    })
  })
})

describe('amis editor drag fallback', () => {
  function element(attrs: Record<string, string>, closestTarget?: unknown) {
    return {
      getAttribute(name: string) {
        return attrs[name] ?? null
      },
      closest() {
        return closestTarget ?? this
      },
    }
  }

  it('starts only after a real drag distance', () => {
    const start = { clientX: 10, clientY: 10 }

    expect(hasExceededAmisEditorFallbackDragThreshold(start, { clientX: 12, clientY: 12 })).toBe(false)
    expect(hasExceededAmisEditorFallbackDragThreshold(start, { clientX: 18, clientY: 10 })).toBe(true)
  })

  it('resolves renderer and canvas region targets from AMIS editor DOM markers', () => {
    const renderer = element({ 'data-dnd-id': 'tpl' })
    const rendererChild = element({}, renderer)
    const region = element({ 'data-region-host': 'u:page', 'data-region': 'body' })
    const regionChild = element({}, region)

    expect(getAmisEditorFallbackRendererId(rendererChild)).toBe('tpl')
    expect(getAmisEditorFallbackDropTarget(regionChild)).toEqual({ id: 'u:page', region: 'body' })
  })

  it('enables the fallback for JCEF-like browser hosts', () => {
    expect(shouldUseAmisEditorDragFallback({ navigator: { userAgent: 'Mozilla/5.0 Chrome/120 Safari/537.36' } })).toBe(false)
    expect(shouldUseAmisEditorDragFallback({ navigator: { userAgent: 'Mozilla/5.0 JCEF Chrome/120' } })).toBe(true)
    expect(shouldUseAmisEditorDragFallback({ navigator: { userAgent: 'Mozilla/5.0 Chrome/120' }, cefQuery: () => undefined })).toBe(true)
  })
})

describe('metadata webview html', () => {
  it('allows extension-local AMIS chunks while keeping inline bootstrap nonce-bound', () => {
    const html = createMetadataEditorWebviewHtml({
      template: metadataEditorWebviewTemplate,
      fileName: 'main.menu.json',
      nonce: 'abc123',
      cspSource: 'vscode-resource:',
      amisSdkScriptUri: 'vscode-resource:/amis-sdk/sdk.js',
      amisSdkCssUri: 'vscode-resource:/amis-sdk/sdk.css',
      amisThemeCssUri: 'vscode-resource:/amis-sdk/cxd.css',
      amisDarkThemeCssUri: 'vscode-resource:/amis-sdk/dark.css',
      runtimeScriptUri: 'vscode-resource:/runtime/metadata-editor-runtime.js',
      hostScript: 'window.OuroborosMetadataEditorHost = { initialState: {}, transport: {} };',
    })

    expect(html).toContain("script-src vscode-resource: 'nonce-abc123'")
    expect(html).toContain('font-src vscode-resource: data:')
    expect(html).toContain('nonce="abc123" src="vscode-resource:/amis-sdk/sdk.js"')
    expect(html).toContain('nonce="abc123" src="vscode-resource:/runtime/metadata-editor-runtime.js"')
    expect(html).toContain('<html lang="zh-CN">')
    expect(html).toContain('<body class="amis-scope">')
    expect(html).toContain('id="metadata-amis-root"')
    expect(html).toContain('id="metadata-amis-theme-cxd"')
    expect(html).toContain('id="metadata-amis-theme-dark"')
    expect(html).toContain('body.metadata-theme-light { color-scheme: light; }')
    expect(html).toContain('body.metadata-amis-editor-light')
    expect(html).toContain('body.metadata-amis-editor-light .cxd-Modal { overflow-y: auto;')
    expect(html).toContain('body.metadata-amis-editor-light .cxd-Modal-content,')
    expect(html).toContain('body.metadata-amis-editor-light .cxd-Modal-body { max-height: none; overflow: visible; }')
    expect(html).toContain('body.metadata-amis-editor-light .cxd-ContextMenu-menu::-webkit-scrollbar-thumb')
    expect(html).not.toContain('metadata-json')
    expect(html).not.toContain('metadata-save')
    expect(html).not.toContain('metadata-validate')
    expect(html).not.toContain('metadata-type')
    expect(html).not.toContain('main.menu.json')
  })

  it('allows eval only when the AMIS visual editor runtime is loaded', () => {
    const html = createMetadataEditorWebviewHtml({
      template: metadataEditorWebviewTemplate,
      fileName: 'main.ui-schema.json',
      nonce: 'abc123',
      cspSource: 'vscode-resource:',
      amisSdkScriptUri: 'vscode-resource:/amis-sdk/sdk.js',
      amisSdkCssUri: 'vscode-resource:/amis-sdk/sdk.css',
      amisThemeCssUri: 'vscode-resource:/amis-sdk/cxd.css',
      amisDarkThemeCssUri: 'vscode-resource:/amis-sdk/dark.css',
      amisEditorRuntimeScriptUri: 'vscode-resource:/runtime/metadata-editor-amis-editor.js',
      amisEditorCssUri: 'vscode-resource:/runtime/metadata-editor-amis-editor.css',
      runtimeScriptUri: 'vscode-resource:/runtime/metadata-editor-runtime.js',
      hostScript: 'window.OuroborosMetadataEditorHost = { initialState: {}, transport: {} };',
    })

    expect(html).toContain("script-src vscode-resource: 'nonce-abc123' 'unsafe-eval'")
    expect(html).toContain('nonce="abc123" src="vscode-resource:/runtime/metadata-editor-amis-editor.js"')
    expect(html).toContain('href="vscode-resource:/runtime/metadata-editor-amis-editor.css"')
  })
})

describe('logical host and serializer', () => {
  it('runs the shared host contract for an embedded IDE browser', async () => {
    const uri = '/repo/src/main/metadata/menu-model/main.menu.json'
    let savedText = ''
    const browserHost = createBrowserMetadataEditorHost({
      uri,
      metadataType: 'menu',
      initialDocument: {
        text: '{"title":"Main","fullName":"main"}\n',
        revision: '7',
      },
      async saveText(text) {
        savedText = text
        return { revision: '8' }
      },
    })

    const loaded = await browserHost.loadState()
    const updated = await browserHost.saveText(
      '{"title":"Main menu","fullName":"main"}\n',
      loaded.document.revision,
    )

    expect(loaded.document).toMatchObject({ type: 'menu', revision: '7', diagnostics: [] })
    expect(loaded.editorSchema).toMatchObject({ type: 'form', title: '菜单模型' })
    expect(savedText).toBe('{"title":"Main menu","fullName":"main"}\n')
    expect(updated.document).toMatchObject({ revision: '8', diagnostics: [] })
  })

  it('keeps a newer external document when a native save finishes late', async () => {
    const uri = '/repo/src/main/metadata/menu-model/main.menu.json'
    let finishSave: ((value: { revision: string }) => void) | undefined
    const browserHost = createBrowserMetadataEditorHost({
      uri,
      metadataType: 'menu',
      initialDocument: {
        text: '{"title":"Main","fullName":"main"}\n',
        revision: '7',
      },
      saveText: () => new Promise((resolve) => {
        finishSave = resolve
      }),
    })

    const saving = browserHost.saveText('{"title":"Local","fullName":"main"}\n', '7')
    await browserHost.applyExternalDocument({
      text: '{"title":"External","fullName":"main"}\n',
      revision: '9',
    })
    finishSave?.({ revision: '8' })

    await expect(saving).rejects.toMatchObject({ code: 'revision-conflict' })
    await expect(browserHost.loadState()).resolves.toMatchObject({
      document: {
        revision: '9',
        value: { title: 'External', fullName: 'main' },
      },
    })
  })

  it('accepts the matching document event emitted by its own native save', async () => {
    const uri = '/repo/src/main/metadata/menu-model/main.menu.json'
    let browserHost: ReturnType<typeof createBrowserMetadataEditorHost>
    browserHost = createBrowserMetadataEditorHost({
      uri,
      metadataType: 'menu',
      initialDocument: {
        text: '{"title":"Main","fullName":"main"}\n',
        revision: '7',
      },
      async saveText(text) {
        await browserHost.applyExternalDocument({ text, revision: '8' })
        return { revision: '8' }
      },
    })

    await expect(
      browserHost.saveText('{"title":"Local","fullName":"main"}\n', '7'),
    ).resolves.toMatchObject({ document: { revision: '8', value: { title: 'Local' } } })
  })

  it('loads, validates, edits, and serializes through an IDE file bridge', async () => {
    const uri = '/repo/src/main/metadata/menu-model/main.menu.json'
    const bridge = new InMemoryMetadataFileBridge({
      [uri]: '{"title":"Main","fullName":"main"}\n',
    })
    const host = createMetadataEditorHost(bridge)

    const loaded = await host.loadDocument(uri)
    expect(loaded.type).toBe('menu')
    expect(loaded.diagnostics).toEqual([])

    const nextText = serializeMetadataDocument({ title: 'Main', fullName: 'main' }, getContributionByType('menu'))
    const updated = await host.applyChange(uri, nextText, loaded.revision)
    expect(updated.text).toBe('{\n  "title": "Main",\n  "fullName": "main"\n}\n')
    expect(bridge.getDiagnostics(uri)).toEqual([])
  })

  it('preserves object property order during metadata serialization', () => {
    const text = serializeMetadataDocument({
      title: 'Main',
      fullName: 'main',
      children: [{ title: 'Child', fullName: 'child' }],
    }, getContributionByType('dev-menu'))

    expect(text).toBe(`{
  "title": "Main",
  "fullName": "main",
  "children": [
    {
      "title": "Child",
      "fullName": "child"
    }
  ]
}
`)
  })

  it('preserves invalid JSON text and publishes diagnostics without writing a fallback object', async () => {
    const uri = '/repo/src/main/metadata/authority/broken.authority.json'
    const bridge = new InMemoryMetadataFileBridge({ [uri]: '{' })
    const host = createMetadataEditorHost(bridge)

    const loaded = await host.loadDocument(uri)

    expect(loaded.text).toBe('{')
    expect(loaded.value).toBeUndefined()
    expect(loaded.diagnostics).toEqual([expect.objectContaining({ code: 'invalid-json', severity: 'error' })])
    expect((await bridge.loadText(uri)).text).toBe('{')
  })

  it('validates required schema fields from the metadata type contribution', async () => {
    const uri = '/repo/src/main/metadata/menu-model/broken.menu.json'
    const bridge = new InMemoryMetadataFileBridge({ [uri]: '{"fullName":7,"placement":"side"}' })
    const host = createMetadataEditorHost(bridge)

    const loaded = await host.loadDocument(uri)

    expect(loaded.diagnostics).toEqual([
      expect.objectContaining({ code: 'schema-required-property', path: 'title', severity: 'error' }),
      expect.objectContaining({ code: 'schema-property-type', path: 'fullName', severity: 'error' }),
      expect.objectContaining({ code: 'schema-enum-value', path: 'placement', severity: 'error' }),
    ])
  })

  it('loads editor metadata by file suffix outside the packaged source path', async () => {
    const uri = '/tmp/resource-editor.menu.json'
    const bridge = new InMemoryMetadataFileBridge({
      [uri]: '{"title":"Resource Editor","fullName":"resource-editor"}\n',
    })
    const host = createMetadataEditorHost(bridge)

    const loaded = await host.loadDocument(uri)
    const contribution = await host.getTypeContribution(uri)

    expect(loaded.type).toBe('menu')
    expect(loaded.packagedPath).toBe('META-INF/ouroboros/metadata/resource-editor.menu.json')
    expect(loaded.diagnostics).toEqual([])
    expect(contribution.createEditorSchema({ uri, document: loaded.value })).toMatchObject({ type: 'form' })
  })

  it('validates runtime menu and authority structures', async () => {
    const menuUri = '/repo/src/main/metadata/menu-model/broken.menu.json'
    const authorityUri = '/repo/src/main/metadata/authority/broken.authority.json'
    const devMenuUri = '/repo/src/main/metadata/dev-menu-model/broken.dev-menu.json'
    const bridge = new InMemoryMetadataFileBridge({
      [menuUri]: '{"fullName":"main","title":"Main","order":"first"}',
      [authorityUri]: '{"fullName":"auth","title":"Auth","apis":[9]}',
      [devMenuUri]: '{"fullName":"dev","title":"Dev","stage":"prod","children":[{"title":"Child"}]}',
    })
    const host = createMetadataEditorHost(bridge)

    await expect(host.loadDocument(menuUri)).resolves.toMatchObject({
      diagnostics: [expect.objectContaining({ code: 'schema-property-type', path: 'order' })],
    })
    await expect(host.loadDocument(authorityUri)).resolves.toMatchObject({
      diagnostics: [expect.objectContaining({ code: 'schema-property-type', path: 'apis[0]' })],
    })
    await expect(host.loadDocument(devMenuUri)).resolves.toMatchObject({
      diagnostics: [
        expect.objectContaining({ code: 'schema-enum-value', path: 'stage' }),
        expect.objectContaining({ code: 'schema-required-property', path: 'children[0].fullName' }),
      ],
    })
  })
})
