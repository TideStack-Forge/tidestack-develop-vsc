type Listener = (mutation?: unknown, state?: unknown) => void;
export declare const store: {
    state: {
        user: {
            userInfo: {};
            authorities: {};
        };
        app: {
            config: {};
            theme: string;
            locale: string;
        };
    };
    getters: Record<string, unknown>;
    dispatch: (_action: string, _payload?: unknown) => Promise<undefined>;
    commit: (_type: string, _payload?: unknown) => undefined;
    subscribe: (_listener: Listener) => () => undefined;
    reset: () => undefined;
};
export declare function getStore(): {
    state: {
        user: {
            userInfo: {};
            authorities: {};
        };
        app: {
            config: {};
            theme: string;
            locale: string;
        };
    };
    getters: Record<string, unknown>;
    dispatch: (_action: string, _payload?: unknown) => Promise<undefined>;
    commit: (_type: string, _payload?: unknown) => undefined;
    subscribe: (_listener: Listener) => () => undefined;
    reset: () => undefined;
};
export declare function readState(): {
    user: {
        userInfo: {};
        authorities: {};
    };
    app: {
        config: {};
        theme: string;
        locale: string;
    };
};
export declare function readGetters(): Record<string, unknown>;
export declare function dispatch(action: string, payload?: unknown): Promise<undefined>;
export declare function commit(type: string, payload?: unknown): undefined;
export declare function subscribeState(listener: Listener): () => undefined;
export declare function resetStore(): void;
export {};
