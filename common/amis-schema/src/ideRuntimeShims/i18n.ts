const manager = {
  getLocale: () => 'zh-CN',
  tn: (_schemaId: string, _key: string, fallback: string) => fallback,
}

export const i18nService = {
  getManager: () => manager,
}

export default i18nService
