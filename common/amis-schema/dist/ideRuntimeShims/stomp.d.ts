export declare function isStompInitDestination(destination: string): boolean;
export declare function subscribeWithInitial(): {
    bootstrapDone: Promise<void>;
    unsubscribe: () => undefined;
};
export declare function subscribeTopic(): () => undefined;
export declare function subscribeQueue(): () => undefined;
export declare function subscribeUserTopic(): () => undefined;
export declare function subscribe(): () => undefined;
export declare function unsubscribeTopic(): void;
export declare function unsubscribeQueue(): void;
export declare function unsubscribeUserTopic(): void;
export declare function unsubscribe(): void;
export declare function unsubscribeAll(): void;
export declare function unsubscribeAllTopics(): void;
export declare function unsubscribeAllQueues(): void;
export declare function unsubscribeAllUserTopics(): void;
export declare function sendBinary(): Promise<void>;
export declare function sendText(): Promise<void>;
export declare function sendJson(): Promise<void>;
export declare function send(): Promise<void>;
export declare function connect(): Promise<void>;
export declare function disconnect(): Promise<void>;
export declare function reconnect(): Promise<void>;
export declare function onStompConnected(): () => undefined;
export declare function onStompDisconnected(): () => undefined;
export declare function isConnected(): boolean;
export declare function isActive(): boolean;
export declare function isStompAuthenticated(): boolean;
export default class StompClient {
}
