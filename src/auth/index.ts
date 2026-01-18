/**
 * Authentication module exports
 *
 * This module provides the primary authentication API for the MCP Google Slides server.
 * The main entry point is getAuthenticatedClient(), which handles the entire OAuth flow.
 */

// Primary authentication API
export {
  getAuthenticatedClient,
  AuthenticationError,
  AuthFlowCancelledError,
  TokenRefreshFailedError,
} from './oauth-client.js';

// Token storage utilities (for advanced use cases)
export {
  loadTokens,
  saveTokens,
  deleteTokens,
  areTokensExpiring,
  getTokenPath,
} from './token-store.js';

// OAuth configuration
export {
  getOAuthConfig,
  OAUTH_ENDPOINTS,
  OAUTH_SCOPES,
  type OAuthConfig,
} from './config.js';

// PKCE utilities (exported for testing)
export {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from './pkce.js';

// Callback server (exported for testing)
export {
  startCallbackServer,
  getCallbackUrl,
  CallbackTimeoutError,
  StateMismatchError,
  OAuthCallbackError,
  type CallbackResult,
  type CallbackServerConfig,
} from './callback-server.js';
