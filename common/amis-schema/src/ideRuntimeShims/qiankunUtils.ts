export function isConstructable() {
  return false
}

export function isCallable(fn: unknown) {
  return typeof fn === 'function'
}

export function isBoundedFunction() {
  return false
}

export function isPropertyFrozen(target: unknown, property: PropertyKey) {
  if (target == null) {
    return false
  }
  const descriptor = Object.getOwnPropertyDescriptor(Object(target), property)
  return Boolean(descriptor && descriptor.configurable === false && descriptor.writable === false)
}

export function noop() {}
