const noopUnsubscribe = () => undefined

export function isStompInitDestination(destination: string) {
  return destination.startsWith('/app/') && destination.endsWith('/init')
}

export function subscribeWithInitial() {
  return { bootstrapDone: Promise.resolve(), unsubscribe: noopUnsubscribe }
}

export function subscribeTopic() {
  return noopUnsubscribe
}

export function subscribeQueue() {
  return noopUnsubscribe
}

export function subscribeUserTopic() {
  return noopUnsubscribe
}

export function subscribe() {
  return noopUnsubscribe
}

export function unsubscribeTopic() {}

export function unsubscribeQueue() {}

export function unsubscribeUserTopic() {}

export function unsubscribe() {}

export function unsubscribeAll() {}

export function unsubscribeAllTopics() {}

export function unsubscribeAllQueues() {}

export function unsubscribeAllUserTopics() {}

export async function sendBinary() {}

export async function sendText() {}

export async function sendJson() {}

export async function send() {}

export async function connect() {}

export async function disconnect() {}

export async function reconnect() {}

export function onStompConnected() {
  return noopUnsubscribe
}

export function onStompDisconnected() {
  return noopUnsubscribe
}

export function isConnected() {
  return false
}

export function isActive() {
  return false
}

export function isStompAuthenticated() {
  return false
}

export default class StompClient {}
