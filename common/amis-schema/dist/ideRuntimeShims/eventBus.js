"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = void 0;
const handlers = new Map();
exports.EventBus = {
    subscribe(event, handler) {
        const listeners = handlers.get(event) ?? new Set();
        listeners.add(handler);
        handlers.set(event, listeners);
    },
    subscribeOnce(event, handler) {
        const once = (data) => {
            exports.EventBus.unsubscribe(event, once);
            handler(data);
        };
        exports.EventBus.subscribe(event, once);
    },
    unsubscribe(event, handler) {
        handlers.get(event)?.delete(handler);
    },
    unsubscribeAll(event) {
        handlers.delete(event);
    },
    publish(event, data) {
        handlers.get(event)?.forEach((handler) => handler(data));
    },
    removeAllReplayEvents() { },
    removeReplayEvent() { },
};
