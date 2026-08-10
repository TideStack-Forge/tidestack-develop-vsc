"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommonProps = createCommonProps;
exports.getCommonProps = getCommonProps;
function createCommonProps() {
    return getCommonProps();
}
function getCommonProps() {
    return {
        router: {},
        store: {},
        utils: {},
        capabilities: {},
    };
}
