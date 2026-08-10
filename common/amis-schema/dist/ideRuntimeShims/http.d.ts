declare function emptyResponse(): Promise<{
    status: number;
    data: {
        items: never[];
        total: number;
    };
}>;
export declare const Client: {
    get: typeof emptyResponse;
    post: typeof emptyResponse;
    put: typeof emptyResponse;
    patch: typeof emptyResponse;
    delete: typeof emptyResponse;
};
export default Client;
