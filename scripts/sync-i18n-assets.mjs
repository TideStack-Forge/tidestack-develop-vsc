import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const pluginRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const sharedI18nRoot = join(pluginRoot, 'common', 'amis-schema', 'src', 'i18n')
const distI18nRoot = join(pluginRoot, 'dist', 'i18n')

const enUs = join(sharedI18nRoot, 'en-US.json')
const zhCn = join(sharedI18nRoot, 'zh-CN.json')

for (const file of [enUs, zhCn]) {
  if (!existsSync(file)) {
    throw new Error(`Missing TideStack Develop i18n file: ${file}`)
  }
}

const enUsMessages = JSON.parse(readFileSync(enUs, 'utf8'))
const zhCnMessages = JSON.parse(readFileSync(zhCn, 'utf8'))

writeFileSync(join(pluginRoot, 'package.nls.json'), `${JSON.stringify(enUsMessages, null, 2)}\n`)
writeFileSync(join(pluginRoot, 'package.nls.zh-cn.json'), `${JSON.stringify(zhCnMessages, null, 2)}\n`)

mkdirSync(distI18nRoot, { recursive: true })
cpSync(enUs, join(distI18nRoot, 'en-US.json'))
cpSync(zhCn, join(distI18nRoot, 'zh-CN.json'))
