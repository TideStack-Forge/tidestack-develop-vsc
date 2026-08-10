import { createRequire } from 'node:module'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const require = createRequire(import.meta.url)
const configDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(configDir, '../../..')
const frontendSrc = resolve(repoRoot, 'frontends/web/main-app/src')
const shimSrc = resolve(configDir, 'src/ideRuntimeShims')
function packageRootFromEntry(packageName: string, entry: string) {
  const parts = packageName.split('/')
  let current = dirname(entry)
  while (current !== dirname(current)) {
    const matched = parts.length === 1
      ? basename(current) === parts[0]
      : basename(current) === parts[1] && basename(dirname(current)) === parts[0]
    if (matched) {
      return current
    }
    current = dirname(current)
  }
  return dirname(entry)
}

function packageRoot(packageName: string) {
  return packageRootFromEntry(packageName, require.resolve(packageName))
}

const amisRoot = packageRoot('amis')
const amisCoreRoot = packageRoot('amis-core')
const amisEditorRoot = packageRoot('amis-editor')
const amisEditorCoreRoot = packageRoot('amis-editor-core')
const amisThemeEditorHelperRoot = packageRoot('amis-theme-editor-helper')
const amisUiRoot = packageRoot('amis-ui')
const reactRoot = packageRoot('react')
const reactDomRoot = packageRoot('react-dom')
const reactIntersectionObserverRoot = packageRoot('react-intersection-observer')
const reactGridLayoutRoot = packageRoot('react-grid-layout')
const reactResizableRoot = packageRoot('react-resizable')

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.PLAYWRIGHT_HARNESS': JSON.stringify('false'),
    'process.env.BASE_URL': JSON.stringify(''),
  },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        jsx: 'react-jsx',
      },
    },
  },
  resolve: {
    alias: [
      { find: /^i18n-runtime$/, replacement: resolve(shimSrc, 'i18nRuntime.ts') },
      { find: /^amis\/lib\/(.*)$/, replacement: `${amisRoot}/esm/$1` },
      { find: /^amis$/, replacement: `${amisRoot}/esm/index.js` },
      { find: /^amis\/(.*)$/, replacement: `${amisRoot}/$1` },
      { find: /^amis-core\/lib\/(.*)$/, replacement: `${amisCoreRoot}/esm/$1` },
      { find: /^amis-core$/, replacement: `${amisCoreRoot}/esm/index.js` },
      { find: /^amis-core\/(.*)$/, replacement: `${amisCoreRoot}/$1` },
      { find: /^amis-editor\/lib\/(.*)$/, replacement: `${amisEditorRoot}/esm/$1` },
      { find: /^amis-editor$/, replacement: `${amisEditorRoot}/esm/index.js` },
      { find: /^amis-editor\/(.*)$/, replacement: `${amisEditorRoot}/$1` },
      { find: /^amis-editor-core\/lib\/style\.css$/, replacement: `${amisEditorCoreRoot}/lib/style.css` },
      { find: /^amis-editor-core\/lib\/(.*)$/, replacement: `${amisEditorCoreRoot}/esm/$1` },
      { find: /^amis-editor-core$/, replacement: `${amisEditorCoreRoot}/esm/index.js` },
      { find: /^amis-editor-core\/(.*)$/, replacement: `${amisEditorCoreRoot}/$1` },
      { find: /^amis-theme-editor-helper\/lib\/(.*)$/, replacement: `${amisThemeEditorHelperRoot}/esm/$1` },
      { find: /^amis-theme-editor-helper$/, replacement: `${amisThemeEditorHelperRoot}/esm/index.js` },
      { find: /^amis-theme-editor-helper\/(.*)$/, replacement: `${amisThemeEditorHelperRoot}/$1` },
      { find: /^amis-ui\/lib\/(.*)$/, replacement: `${amisUiRoot}/esm/$1` },
      { find: /^amis-ui$/, replacement: `${amisUiRoot}/esm/index.js` },
      { find: /^amis-ui\/(.*)$/, replacement: `${amisUiRoot}/$1` },
      { find: /^react$/, replacement: require.resolve('react') },
      { find: /^react\/(.*)$/, replacement: `${reactRoot}/$1` },
      { find: /^react-dom$/, replacement: require.resolve('react-dom') },
      { find: /^react-dom\/(.*)$/, replacement: `${reactDomRoot}/$1` },
      { find: /^react-intersection-observer$/, replacement: require.resolve('react-intersection-observer') },
      { find: /^react-intersection-observer\/(.*)$/, replacement: `${reactIntersectionObserverRoot}/$1` },
      { find: /^react-grid-layout$/, replacement: require.resolve('react-grid-layout') },
      { find: /^react-grid-layout\/(.*)$/, replacement: `${reactGridLayoutRoot}/$1` },
      { find: /^react-resizable$/, replacement: require.resolve('react-resizable') },
      { find: /^react-resizable\/(.*)$/, replacement: `${reactResizableRoot}/$1` },
      { find: /^axios$/, replacement: require.resolve('axios') },
      { find: /^lodash$/, replacement: require.resolve('lodash') },
      { find: /^moment$/, replacement: require.resolve('moment') },
      { find: /^sortablejs$/, replacement: require.resolve('sortablejs') },
      { find: 'exceljs', replacement: resolve(shimSrc, 'exceljs.ts') },
      { find: 'file-saver', replacement: resolve(shimSrc, 'fileSaver.ts') },
      { find: /^qiankun$/, replacement: resolve(shimSrc, 'qiankun.ts') },
      { find: /^qiankun\/lib\/utils$/, replacement: resolve(shimSrc, 'qiankunUtils.ts') },
      { find: '@/common/api/amis', replacement: resolve(shimSrc, 'apiAmis.ts') },
      { find: '@/common/api/auth', replacement: resolve(shimSrc, 'apiAuth.ts') },
      { find: '@/common/auth/flow', replacement: resolve(shimSrc, 'authFlow.ts') },
      { find: '@/common/eventBus', replacement: resolve(shimSrc, 'eventBus.ts') },
      { find: '@/common/i18n/amis', replacement: resolve(shimSrc, 'i18nAmis.ts') },
      { find: '@/common/i18n', replacement: resolve(shimSrc, 'i18n.ts') },
      { find: '@/common/menus', replacement: resolve(shimSrc, 'menus.ts') },
      { find: '@/common/micro/commonProps', replacement: resolve(shimSrc, 'microCommonProps.ts') },
      { find: '@/common/micro/utils', replacement: resolve(shimSrc, 'microUtils.ts') },
      { find: '@/common/modal', replacement: resolve(shimSrc, 'modal.ts') },
      { find: '@/common/tabs', replacement: resolve(shimSrc, 'tabs.ts') },
      { find: '@/layouts/useHostSnapshot', replacement: resolve(shimSrc, 'useHostSnapshot.ts') },
      { find: '@/router/routerFacade', replacement: resolve(shimSrc, 'routerFacade.ts') },
      { find: '@/router/utils', replacement: resolve(shimSrc, 'routerUtils.ts') },
      { find: '@/store/storeFacade', replacement: resolve(shimSrc, 'storeFacade.ts') },
      { find: '@/utils/http', replacement: resolve(shimSrc, 'http.ts') },
      { find: '@/utils/statisticsStudioDirtyGuard', replacement: resolve(shimSrc, 'statisticsStudioDirtyGuard.ts') },
      { find: '@/utils/Stomp', replacement: resolve(shimSrc, 'stomp.ts') },
      { find: '@/utils/theme', replacement: resolve(shimSrc, 'theme.ts') },
      { find: '@/utils/toast', replacement: resolve(shimSrc, 'toast.ts') },
      { find: /^@\/(.*)$/, replacement: `${frontendSrc}/$1` },
    ],
  },
  build: {
    emptyOutDir: true,
    lib: {
      entry: 'src/amisEditorRuntime.ts',
      name: 'OuroborosAmisEditorRuntime',
      formats: ['iife'],
      fileName: () => 'metadata-editor-amis-editor.js',
    },
    cssFileName: 'metadata-editor-amis-editor.css',
    outDir: 'dist/amis-editor',
    minify: false,
  },
})
