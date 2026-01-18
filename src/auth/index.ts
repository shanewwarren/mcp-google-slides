/**
 * Authentication module exports
 *
 * This module provides the primary authentication API for the MCP Google Slides server.
 * The main entry point is getAuthenticatedClient(), which handles the entire OAuth flow.
 */

// Callback server (exported for testing)
export {
  type CallbackResult,
  type CallbackServerConfig,
  CallbackTimeoutError,
  getCallbackUrl,
  OAuthCallbackError,
  StateMismatchError,
  startCallbackServer,
} from './callback-server.js';
// OAuth configuration
export {
  getOAuthConfig,
  OAUTH_ENDPOINTS,
  OAUTH_SCOPES,
  type OAuthConfig,
} from './config.js';
// Primary authentication API
export {
  AuthenticationError,
  AuthFlowCancelledError,
  getAuthenticatedClient,
  TokenRefreshFailedError,
} from './oauth-client.js';

// PKCE utilities (exported for testing)
export {
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from './pkce.js';
// Token storage utilities (for advanced use cases)
export {
  areTokensExpiring,
  deleteTokens,
  getTokenPath,
  loadTokens,
  saveTokens,
} from './token-store.js';
