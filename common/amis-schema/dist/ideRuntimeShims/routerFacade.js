"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushLocation = pushLocation;
exports.replaceLocation = replaceLocation;
exports.readCurrentRoute = readCurrentRoute;
function pushLocation(to) {
    if (typeof window !== 'undefined' && to) {
        window.location.hash = to;
    }
}
function replaceLocation(to) {
    if (typeof window !== 'undefined' && to) {
        window.location.hash = to;
    }
}
function readCurrentRoute() {
    return { params: {}, query: {} };
}
