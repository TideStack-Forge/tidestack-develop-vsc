type Handler = (data?: unknown) => void

const handlers = new Map<string, Set<Handler>>()

export const EventBus = {
  subscribe(event: string, handler: Handler) {
    const listeners = handlers.get(event) ?? new Set<Handler>()
    listeners.add(handler)
    handlers.set(event, listeners)
  },
  subscribeOnce(event: string, handler: Handler) {
    const once = (data?: unknown) => {
      EventBus.unsubscribe(event, once)
      handler(data)
    }
    EventBus.subscribe(event, once)
  },
  unsubscribe(event: string, handler: Handler) {
    handlers.get(event)?.delete(handler)
  },
  unsubscribeAll(event: string) {
    handlers.delete(event)
  },
  publish(event: string, data?: unknown) {
    handlers.get(event)?.forEach((handler) => handler(data))
  },
  removeAllReplayEvents() {},
  removeReplayEvent() {},
}
