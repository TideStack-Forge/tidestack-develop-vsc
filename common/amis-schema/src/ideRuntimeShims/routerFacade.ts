export function pushLocation(to: string) {
  if (typeof window !== 'undefined' && to) {
    window.location.hash = to
  }
}

export function replaceLocation(to: string) {
  if (typeof window !== 'undefined' && to) {
    window.location.hash = to
  }
}

export function readCurrentRoute() {
  return { params: {}, query: {} }
}
