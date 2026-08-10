type Handler = (data?: unknown) => void;
export declare const EventBus: {
    subscribe(event: string, handler: Handler): void;
    subscribeOnce(event: string, handler: Handler): void;
    unsubscribe(event: string, handler: Handler): void;
    unsubscribeAll(event: string): void;
    publish(event: string, data?: unknown): void;
    removeAllReplayEvents(): void;
    removeReplayEvent(): void;
};
export {};
