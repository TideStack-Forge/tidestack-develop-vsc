export type MicroApp = {
    mount?: () => Promise<void>;
    unmount?: () => Promise<void>;
};
export declare function loadMicroApp(): MicroApp;
