"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18n = exports.extendLocale = void 0;
exports.appI18n = appI18n;
exports.currentLocale = currentLocale;
exports.setLocale = setLocale;
exports.translate = translate;
const amis_core_1 = require("amis-core");
Object.defineProperty(exports, "extendLocale", { enumerable: true, get: function () { return amis_core_1.extendLocale; } });
const defaultLocale = 'zh-CN';
let activeLocale = defaultLocale;
(0, amis_core_1.setDefaultLocale)(activeLocale);
exports.i18n = (0, amis_core_1.makeTranslator)(activeLocale);
function appI18n(key, data) {
    return (0, amis_core_1.makeTranslator)(activeLocale)(key, data);
}
function currentLocale() {
    return activeLocale;
}
function setLocale(locale) {
    activeLocale = normalizeLocale(locale);
    (0, amis_core_1.setDefaultLocale)(activeLocale);
}
function translate(value, props) {
    const data = props?.data;
    if (!props?.key) {
        return format(value, data);
    }
    const result = (0, amis_core_1.makeTranslator)(activeLocale)(props.key, data);
    return result === props.key ? format(value, data) : result;
}
function normalizeLocale(locale) {
    const value = locale || 'zh-CN';
    if (value.includes('en')) {
        return 'en-US';
    }
    if (value.includes('zh') || value.includes('cn')) {
        return 'zh-CN';
    }
    return value;
}
function format(value, data) {
    return value.replace(/(\\)?\{\{([\s\S]+?)\}\}/g, (raw, escape, key) => {
        if (escape) {
            return raw.substring(1);
        }
        return String((0, amis_core_1.resolveVariable)(key, data || {}) ?? '');
    });
}
