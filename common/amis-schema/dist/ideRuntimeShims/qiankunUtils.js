"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isConstructable = isConstructable;
exports.isCallable = isCallable;
exports.isBoundedFunction = isBoundedFunction;
exports.isPropertyFrozen = isPropertyFrozen;
exports.noop = noop;
function isConstructable() {
    return false;
}
function isCallable(fn) {
    return typeof fn === 'function';
}
function isBoundedFunction() {
    return false;
}
function isPropertyFrozen(target, property) {
    if (target == null) {
        return false;
    }
    const descriptor = Object.getOwnPropertyDescriptor(Object(target), property);
    return Boolean(descriptor && descriptor.configurable === false && descriptor.writable === false);
}
function noop() { }
