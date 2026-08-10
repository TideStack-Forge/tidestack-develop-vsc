async function emptyResponse() {
  return { status: 0, data: { items: [], total: 0 } }
}

export const Client = {
  get: emptyResponse,
  post: emptyResponse,
  put: emptyResponse,
  patch: emptyResponse,
  delete: emptyResponse,
}

export default Client
