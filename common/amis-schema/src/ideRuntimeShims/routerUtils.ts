export function getRouteInfo(path = '') {
  return { name: path ? 'metadata-editor' : 'notFound', path }
}
