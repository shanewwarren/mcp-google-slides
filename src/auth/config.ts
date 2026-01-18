/**
 * OAuth configuration for Google Slides API
 *
 * This file contains the bundled OAuth credentials for zero-config authentication.
 * Users don't need to create their own OAuth client.
 */

import { getCallbackUrl } from './callback-server.js';

/**
 * OAuth configuration interface
 */
export interface OAuthConfig {
  /** Google Cloud OAuth client ID */
  clientId: string;
  /** Google Cloud OAuth client secret */
  clientSecret: string;
  /** OAuth callback redirect URI */
  redirectUri: string;
  /** Required OAuth scopes */
  scopes: string[];
}

/**
 * Google OAuth endpoints
 */
export const OAUTH_ENDPOINTS = {
  /** Authorization endpoint for initiating OAuth flow */
  authorization: 'https://accounts.google.com/o/oauth2/v2/auth',
  /** Token endpoint for exchanging codes and refreshing tokens */
  token: 'https://oauth2.googleapis.com/token',
  /** Revocation endpoint for revoking tokens */
  revoke: 'https://oauth2.googleapis.com/revoke',
} as const;

/**
 * Required OAuth scopes for Google Slides
 */
export const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/drive.file',
] as const;

/**
 * Bundled OAuth credentials for zero-config experience
 *
 * NOTE: In a production implementation, these credentials would be
 * replaced with actual OAuth client credentials from Google Cloud Console.
 * For now, these are placeholder values.
 *
 * To create your own OAuth credentials:
 * 1. Go to https://console.cloud.google.com/apis/credentials
 * 2. Create a new OAuth 2.0 Client ID (Desktop app type)
 * 3. Add http://127.0.0.1:8085/callback to authorized redirect URIs
 * 4. Replace the values below
 */
const BUNDLED_CLIENT_ID = process.env.MCP_GSLIDES_CLIENT_ID || 'YOUR_CLIENT_ID_HERE';
const BUNDLED_CLIENT_SECRET = process.env.MCP_GSLIDES_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE';

/**
 * Get the OAuth configuration
 *
 * @param port - Optional port override for callback URL
 * @returns OAuth configuration object
 */
export function getOAuthConfig(port?: number): OAuthConfig {
  return {
    clientId: BUNDLED_CLIENT_ID,
    clientSecret: BUNDLED_CLIENT_SECRET,
    redirectUri: getCallbackUrl(port),
    scopes: [...OAUTH_SCOPES],
  };
}
