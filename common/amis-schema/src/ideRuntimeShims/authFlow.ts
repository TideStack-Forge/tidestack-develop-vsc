export const USER_BOOTSTRAP_ERROR_REASON = 'user-bootstrap-failed'

export function resolveReturnUrl() {
  return '/'
}

export function buildReturnUrl() {
  return '/'
}

export function getPreloadedAuthProviders() {
  return []
}

export function isRedirectProvider() {
  return false
}

export function isDirectProvider() {
  return false
}

export function isLocalPasswordLoginEnabled() {
  return false
}

export function shouldShowCredentialForm() {
  return false
}

export function buildCredentialModes() {
  return []
}

export function resolveActiveCredentialMode() {
  return undefined
}

export function shouldShowCredentialModeSwitcher() {
  return false
}

export function buildProviderEntry(provider: unknown) {
  return provider
}

export function shouldIgnoreProviderDiscoveryResult() {
  return true
}

export function shouldIgnoreProviderDiscoveryError() {
  return true
}

export function mapAuthError() {
  return '认证不可用'
}
