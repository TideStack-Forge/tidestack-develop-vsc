"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
async function emptyResponse() {
    return { status: 0, data: { items: [], total: 0 } };
}
exports.Client = {
    get: emptyResponse,
    post: emptyResponse,
    put: emptyResponse,
    patch: emptyResponse,
    delete: emptyResponse,
};
exports.default = exports.Client;
