type Listener = (mutation?: unknown, state?: unknown) => void

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
}

const getters: Record<string, unknown> = {
  activeTabId: 'metadata-editor',
  accessToken: { token: '' },
  'user/hasAuth': () => false,
  'user/hasRole': () => false,
  'user/menu': { globalMenu: [] },
  menu: { globalMenu: [] },
  'user/menuGetter': () => null,
  'app/homePage': '',
}

export const store = {
  state,
  getters,
  dispatch: async (_action: string, _payload?: unknown) => undefined,
  commit: (_type: string, _payload?: unknown) => undefined,
  subscribe: (_listener: Listener) => () => undefined,
  reset: () => undefined,
}

export function getStore() {
  return store
}

export function readState() {
  return state
}

export function readGetters() {
  return getters
}

export function dispatch(action: string, payload?: unknown) {
  return store.dispatch(action, payload)
}

export function commit(type: string, payload?: unknown) {
  return store.commit(type, payload)
}

export function subscribeState(listener: Listener) {
  return store.subscribe(listener)
}

export function resetStore() {
  store.reset()
}
