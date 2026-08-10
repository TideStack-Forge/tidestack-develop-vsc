import { extendLocale } from 'amis-core';
export { extendLocale };
export declare const i18n: import("amis-core").TranslateFn<any>;
export declare function appI18n(key: string, data?: Record<string, unknown>): any;
export declare function currentLocale(): string;
export declare function setLocale(locale: string): void;
export declare function translate(value: string, props?: {
    key?: string;
    data?: Record<string, unknown>;
}): any;
