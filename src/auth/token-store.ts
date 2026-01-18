/**
 * Token storage implementation for persisting OAuth credentials
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import type { StoredTokens } from '../types/common.js';

/**
 * Get the path to the token storage file
 * Supports MCP_GSLIDES_TOKEN_PATH environment variable for custom location
 * @returns Absolute path to tokens.json
 */
export function getTokenPath(): string {
  const customPath = process.env.MCP_GSLIDES_TOKEN_PATH;

  if (customPath) {
    return path.resolve(customPath);
  }

  const homeDir = os.homedir();
  return path.join(homeDir, '.mcp-google-slides', 'tokens.json');
}

/**
 * Ensure the token storage directory exists
 * @param tokenPath - Path to the token file
 */
async function ensureTokenDirectory(tokenPath: string): Promise<void> {
  const dir = path.dirname(tokenPath);

  try {
    await fs.access(dir);
  } catch {
    // Directory doesn't exist, create it
    await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  }
}

/**
 * Load OAuth tokens from persistent storage
 * @returns Stored tokens if they exist, null otherwise
 */
export async function loadTokens(): Promise<StoredTokens | null> {
  const tokenPath = getTokenPath();

  try {
    const data = await fs.readFile(tokenPath, 'utf-8');
    const tokens = JSON.parse(data) as StoredTokens;

    // Validate required fields
    if (!tokens.accessToken || !tokens.refreshToken || !tokens.expiresAt || !tokens.scope) {
      console.error('Invalid token file: missing required fields');
      return null;
    }

    return tokens;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist - this is normal for first-time users
      return null;
    }

    // Other errors (permission issues, corrupt JSON, etc.)
    console.error('Failed to load tokens:', error);
    return null;
  }
}

/**
 * Save OAuth tokens to persistent storage
 * Sets file permissions to 0600 (owner read/write only)
 * @param tokens - The tokens to persist
 */
export async function saveTokens(tokens: StoredTokens): Promise<void> {
  const tokenPath = getTokenPath();

  // Ensure directory exists
  await ensureTokenDirectory(tokenPath);

  // Write tokens to file
  const data = JSON.stringify(tokens, null, 2);
  await fs.writeFile(tokenPath, data, { mode: 0o600 });
}

/**
 * Delete stored OAuth tokens
 * Used for logout or when tokens are revoked
 */
export async function deleteTokens(): Promise<void> {
  const tokenPath = getTokenPath();

  try {
    await fs.unlink(tokenPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // File doesn't exist - nothing to delete
      return;
    }

    throw error;
  }
}

/**
 * Check if tokens are expired or expiring soon
 * @param tokens - The tokens to check
 * @param bufferMinutes - Number of minutes before expiration to consider expired (default: 5)
 * @returns true if tokens are expired or expiring within buffer period
 */
export function areTokensExpiring(tokens: StoredTokens, bufferMinutes: number = 5): boolean {
  const now = Date.now();
  const bufferMs = bufferMinutes * 60 * 1000;
  return tokens.expiresAt <= now + bufferMs;
}
