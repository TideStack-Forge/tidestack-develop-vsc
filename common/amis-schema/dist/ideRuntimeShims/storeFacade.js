"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
exports.getStore = getStore;
exports.readState = readState;
exports.readGetters = readGetters;
exports.dispatch = dispatch;
exports.commit = commit;
exports.subscribeState = subscribeState;
exports.resetStore = resetStore;
const state = {
    user: {
        userInfo: {},
        authorities: {},
    },
    app: {
        config: {},
        theme: 'cxd',
        locale: 'zh-CN',
    },
};
const getters = {
    activeTabId: 'metadata-editor',
    accessToken: { token: '' },
    'user/hasAuth': () => false,
    'user/hasRole': () => false,
    'user/menu': { globalMenu: [] },
    menu: { globalMenu: [] },
    'user/menuGetter': () => null,
    'app/homePage': '',
};
exports.store = {
    state,
    getters,
    dispatch: async (_action, _payload) => undefined,
    commit: (_type, _payload) => undefined,
    subscribe: (_listener) => () => undefined,
    reset: () => undefined,
};
function getStore() {
    return exports.store;
}
function readState() {
    return state;
}
function readGetters() {
    return getters;
}
function dispatch(action, payload) {
    return exports.store.dispatch(action, payload);
}
function commit(type, payload) {
    return exports.store.commit(type, payload);
}
function subscribeState(listener) {
    return exports.store.subscribe(listener);
}
function resetStore() {
    exports.store.reset();
}
