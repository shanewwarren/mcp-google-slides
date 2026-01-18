/**
 * OAuth client wrapper for Google Slides API authentication
 *
 * Provides the main entry point for authentication, handling:
 * - Token loading and validation
 * - Automatic token refresh
 * - Interactive OAuth flow when needed
 */

import { CodeChallengeMethod, OAuth2Client } from 'google-auth-library';
import open from 'open';
import type { StoredTokens } from '../types/common.js';
import { startCallbackServer } from './callback-server.js';
import { getOAuthConfig } from './config.js';
import { generateCodeChallenge, generateCodeVerifier, generateState } from './pkce.js';
import { areTokensExpiring, loadTokens, saveTokens } from './token-store.js';

/**
 * Custom error for authentication failures
 */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error thrown when user cancels or denies OAuth consent
 */
export class AuthFlowCancelledError extends Error {
  constructor() {
    super('OAuth flow was cancelled by the user');
    this.name = 'AuthFlowCancelledError';
  }
}

/**
 * Error thrown when token refresh fails
 */
export class TokenRefreshFailedError extends Error {
  constructor(cause?: Error) {
    super('Failed to refresh access token - refresh token may be revoked or expired');
    this.name = 'TokenRefreshFailedError';
    this.cause = cause;
  }
}

/**
 * Get an authenticated Google OAuth2 client
 *
 * This is the main entry point for authentication. It will:
 * 1. Check for existing valid tokens
 * 2. Refresh tokens if they're expiring soon
 * 3. Start interactive OAuth flow if no valid tokens exist
 *
 * @returns Authenticated OAuth2Client ready for API calls
 * @throws {AuthenticationError} If authentication fails
 */
export async function getAuthenticatedClient(): Promise<OAuth2Client> {
  const config = getOAuthConfig();
  const oauth2Client = new OAuth2Client({
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
  });

  // Try to load existing tokens
  const tokens = await loadTokens();

  if (tokens) {
    // Check if tokens are expiring soon (within 5 minutes)
    if (areTokensExpiring(tokens, 5)) {
      // Attempt to refresh
      try {
        const refreshedTokens = await refreshAccessToken(oauth2Client, tokens.refreshToken);
        setClientCredentials(oauth2Client, refreshedTokens);
        return oauth2Client;
      } catch (_error) {
        // Refresh failed - fall through to interactive flow
        console.error('Token refresh failed, starting new OAuth flow');
      }
    } else {
      // Tokens are still valid
      setClientCredentials(oauth2Client, tokens);
      return oauth2Client;
    }
  }

  // No valid tokens - start interactive OAuth flow
  try {
    const newTokens = await startOAuthFlow(oauth2Client);
    setClientCredentials(oauth2Client, newTokens);
    return oauth2Client;
  } catch (error) {
    throw new AuthenticationError('Failed to complete OAuth authentication', error as Error);
  }
}

/**
 * Start the interactive OAuth flow
 *
 * @param oauth2Client - The OAuth2 client to use
 * @returns The obtained tokens
 * @throws {AuthFlowCancelledError} If user cancels or denies consent
 */
async function startOAuthFlow(oauth2Client: OAuth2Client): Promise<StoredTokens> {
  const config = getOAuthConfig();

  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateState();

  // Build authorization URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Request refresh token
    scope: config.scopes,
    code_challenge: codeChallenge,
    code_challenge_method: CodeChallengeMethod.S256,
    state: state,
    prompt: 'consent', // Force consent screen to ensure refresh token
  });

  console.error('\nOpening browser for Google authentication...');
  console.error('If the browser does not open automatically, visit this URL:');
  console.error(authUrl);
  console.error('');

  // Open browser for user consent
  try {
    await open(authUrl);
  } catch (_error) {
    console.error('Failed to open browser automatically. Please visit the URL above manually.');
  }

  // Start callback server and wait for authorization code
  const callbackResult = await startCallbackServer({
    expectedState: state,
  });

  // Exchange authorization code for tokens
  const { tokens } = await oauth2Client.getToken({
    code: callbackResult.code,
    codeVerifier: codeVerifier,
  });

  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    throw new AuthenticationError('Incomplete token response from Google');
  }

  // Convert to StoredTokens format
  const storedTokens: StoredTokens = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expiry_date,
    scope: tokens.scope || config.scopes.join(' '),
  };

  // Save tokens for future use
  await saveTokens(storedTokens);

  console.error('Authentication successful! Tokens saved.');

  return storedTokens;
}

/**
 * Refresh an expired or expiring access token
 *
 * @param oauth2Client - The OAuth2 client to use
 * @param refreshToken - The refresh token
 * @returns Updated tokens
 * @throws {TokenRefreshFailedError} If refresh fails
 */
async function refreshAccessToken(
  oauth2Client: OAuth2Client,
  refreshToken: string
): Promise<StoredTokens> {
  try {
    // Set the refresh token
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    // Request new access token
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token || !credentials.expiry_date) {
      throw new Error('Incomplete token response from refresh');
    }

    // Convert to StoredTokens format
    const storedTokens: StoredTokens = {
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token || refreshToken, // Use new refresh token if provided
      expiresAt: credentials.expiry_date,
      scope: credentials.scope || '',
    };

    // Save refreshed tokens
    await saveTokens(storedTokens);

    return storedTokens;
  } catch (error) {
    throw new TokenRefreshFailedError(error as Error);
  }
}

/**
 * Set credentials on the OAuth2 client
 *
 * @param oauth2Client - The OAuth2 client to configure
 * @param tokens - The tokens to set
 */
function setClientCredentials(oauth2Client: OAuth2Client, tokens: StoredTokens): void {
  oauth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiresAt,
    scope: tokens.scope,
  });
}
