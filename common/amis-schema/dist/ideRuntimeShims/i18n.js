"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18nService = void 0;
const manager = {
    getLocale: () => 'zh-CN',
    tn: (_schemaId, _key, fallback) => fallback,
};
exports.i18nService = {
    getManager: () => manager,
};
exports.default = exports.i18nService;
