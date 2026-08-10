export type MicroApp = { mount?: () => Promise<void>; unmount?: () => Promise<void> }

export function loadMicroApp(): MicroApp {
  return {
    mount: async () => undefined,
    unmount: async () => undefined,
  }
}
