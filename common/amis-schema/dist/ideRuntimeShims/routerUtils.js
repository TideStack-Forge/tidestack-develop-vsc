"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRouteInfo = getRouteInfo;
function getRouteInfo(path = '') {
    return { name: path ? 'metadata-editor' : 'notFound', path };
}
