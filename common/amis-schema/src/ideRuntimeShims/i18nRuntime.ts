import { extendLocale, makeTranslator, resolveVariable, setDefaultLocale } from 'amis-core'

const defaultLocale = 'zh-CN'

let activeLocale = defaultLocale

setDefaultLocale(activeLocale)

export { extendLocale }

export const i18n = makeTranslator(activeLocale)

export function appI18n(key: string, data?: Record<string, unknown>) {
  return makeTranslator(activeLocale)(key, data)
}

export function currentLocale() {
  return activeLocale
}

export function setLocale(locale: string) {
  activeLocale = normalizeLocale(locale)
  setDefaultLocale(activeLocale)
}

export function translate(value: string, props?: { key?: string; data?: Record<string, unknown> }) {
  const data = props?.data
  if (!props?.key) {
    return format(value, data)
  }
  const result = makeTranslator(activeLocale)(props.key, data)
  return result === props.key ? format(value, data) : result
}

function normalizeLocale(locale?: string) {
  const value = locale || 'zh-CN'
  if (value.includes('en')) {
    return 'en-US'
  }
  if (value.includes('zh') || value.includes('cn')) {
    return 'zh-CN'
  }
  return value
}

function format(value: string, data?: Record<string, unknown>) {
  return value.replace(/(\\)?\{\{([\s\S]+?)\}\}/g, (raw, escape, key) => {
    if (escape) {
      return raw.substring(1)
    }
    return String(resolveVariable(key, data || {}) ?? '')
  })
}
