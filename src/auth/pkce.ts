/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.1 authentication
 * Implements RFC 7636 for secure authorization code exchange
 */

import * as crypto from 'crypto';

/**
 * Encode a buffer to base64url format (RFC 4648 section 5)
 * Base64url encoding is base64 with URL-safe character substitutions:
 * - Replace + with -
 * - Replace / with _
 * - Remove padding =
 *
 * @param buffer - Buffer or Uint8Array to encode
 * @returns Base64url-encoded string
 */
function base64UrlEncode(buffer: Buffer | Uint8Array): string {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Generate a cryptographically secure code verifier for PKCE
 *
 * Per RFC 7636:
 * - Length: 43-128 characters
 * - Character set: [A-Z] [a-z] [0-9] - . _ ~ (unreserved URI characters)
 *
 * This implementation generates 32 random bytes and encodes them as base64url,
 * producing a 43-character verifier.
 *
 * @returns A random code verifier string
 */
export function generateCodeVerifier(): string {
  // Generate 32 random bytes (produces ~43 base64url characters)
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

/**
 * Generate a code challenge from a code verifier using SHA256
 *
 * Per RFC 7636:
 * - Hash the verifier with SHA256
 * - Encode the hash as base64url
 *
 * @param verifier - The code verifier to hash
 * @returns The base64url-encoded SHA256 hash of the verifier
 */
export function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64UrlEncode(hash);
}

/**
 * Generate a random state parameter for CSRF protection
 *
 * The state parameter is used to verify that the OAuth callback
 * corresponds to the original authorization request, preventing
 * CSRF attacks.
 *
 * @returns A random 32-character state string
 */
export function generateState(): string {
  const array = new Uint8Array(24); // Produces 32 base64url characters
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}
