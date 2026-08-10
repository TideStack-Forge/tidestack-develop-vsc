import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/browserHost.ts',
      name: 'OuroborosMetadataEditorHostCore',
      formats: ['iife'],
      fileName: () => 'metadata-editor-host.js',
    },
    outDir: 'dist/browser',
    minify: false,
  },
})
