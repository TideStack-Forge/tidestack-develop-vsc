"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_BOOTSTRAP_ERROR_REASON = void 0;
exports.resolveReturnUrl = resolveReturnUrl;
exports.buildReturnUrl = buildReturnUrl;
exports.getPreloadedAuthProviders = getPreloadedAuthProviders;
exports.isRedirectProvider = isRedirectProvider;
exports.isDirectProvider = isDirectProvider;
exports.isLocalPasswordLoginEnabled = isLocalPasswordLoginEnabled;
exports.shouldShowCredentialForm = shouldShowCredentialForm;
exports.buildCredentialModes = buildCredentialModes;
exports.resolveActiveCredentialMode = resolveActiveCredentialMode;
exports.shouldShowCredentialModeSwitcher = shouldShowCredentialModeSwitcher;
exports.buildProviderEntry = buildProviderEntry;
exports.shouldIgnoreProviderDiscoveryResult = shouldIgnoreProviderDiscoveryResult;
exports.shouldIgnoreProviderDiscoveryError = shouldIgnoreProviderDiscoveryError;
exports.mapAuthError = mapAuthError;
exports.USER_BOOTSTRAP_ERROR_REASON = 'user-bootstrap-failed';
function resolveReturnUrl() {
    return '/';
}
function buildReturnUrl() {
    return '/';
}
function getPreloadedAuthProviders() {
    return [];
}
function isRedirectProvider() {
    return false;
}
function isDirectProvider() {
    return false;
}
function isLocalPasswordLoginEnabled() {
    return false;
}
function shouldShowCredentialForm() {
    return false;
}
function buildCredentialModes() {
    return [];
}
function resolveActiveCredentialMode() {
    return undefined;
}
function shouldShowCredentialModeSwitcher() {
    return false;
}
function buildProviderEntry(provider) {
    return provider;
}
function shouldIgnoreProviderDiscoveryResult() {
    return true;
}
function shouldIgnoreProviderDiscoveryError() {
    return true;
}
function mapAuthError() {
    return '认证不可用';
}
