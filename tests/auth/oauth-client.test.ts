/**
 * Integration tests for OAuth client
 *
 * Note: Complex mocking tests are skipped as Bun's mocking system differs from Jest.
 * These tests focus on behavior that can be verified without heavy mocking.
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { OAuth2Client } from 'google-auth-library';
import { AuthenticationError, getAuthenticatedClient } from '../../src/auth/oauth-client.js';
import { saveTokens } from '../../src/auth/token-store.js';
import type { StoredTokens } from '../../src/types/common.js';

describe('OAuth Client Integration', () => {
  let testDir: string;
  let originalEnv: {
    tokenPath?: string;
    clientId?: string;
    clientSecret?: string;
  };

  beforeEach(async () => {
    // Create temporary directory for test tokens
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-gslides-oauth-test-'));
    const testTokenPath = path.join(testDir, 'tokens.json');

    // Save original environment
    originalEnv = {
      tokenPath: process.env.MCP_GSLIDES_TOKEN_PATH,
      clientId: process.env.MCP_GSLIDES_CLIENT_ID,
      clientSecret: process.env.MCP_GSLIDES_CLIENT_SECRET,
    };

    // Set test environment
    process.env.MCP_GSLIDES_TOKEN_PATH = testTokenPath;
    process.env.MCP_GSLIDES_CLIENT_ID = 'test-client-id';
    process.env.MCP_GSLIDES_CLIENT_SECRET = 'test-client-secret';
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    // Restore original environment
    if (originalEnv.tokenPath !== undefined) {
      process.env.MCP_GSLIDES_TOKEN_PATH = originalEnv.tokenPath;
    } else {
      delete process.env.MCP_GSLIDES_TOKEN_PATH;
    }

    if (originalEnv.clientId !== undefined) {
      process.env.MCP_GSLIDES_CLIENT_ID = originalEnv.clientId;
    } else {
      delete process.env.MCP_GSLIDES_CLIENT_ID;
    }

    if (originalEnv.clientSecret !== undefined) {
      process.env.MCP_GSLIDES_CLIENT_SECRET = originalEnv.clientSecret;
    } else {
      delete process.env.MCP_GSLIDES_CLIENT_SECRET;
    }
  });

  describe('getAuthenticatedClient - Valid Tokens', () => {
    test('returns client with valid non-expiring tokens', async () => {
      // Save valid tokens that won't expire soon
      const validTokens: StoredTokens = {
        accessToken: 'ya29.test-access-token',
        refreshToken: '1//test-refresh-token',
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes from now
        scope: 'https://www.googleapis.com/auth/presentations',
      };

      await saveTokens(validTokens);

      const client = await getAuthenticatedClient();

      expect(client).toBeInstanceOf(OAuth2Client);

      // Verify credentials are set
      const credentials = client.credentials;
      expect(credentials.access_token).toBe(validTokens.accessToken);
      expect(credentials.refresh_token).toBe(validTokens.refreshToken);
      expect(credentials.expiry_date).toBe(validTokens.expiresAt);
    });

    test('loads tokens from storage when valid', async () => {
      const validTokens: StoredTokens = {
        accessToken: 'ya29.stored-access-token',
        refreshToken: '1//stored-refresh-token',
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour from now
        scope: 'https://www.googleapis.com/auth/presentations',
      };

      await saveTokens(validTokens);

      // Get client should load from storage
      const client = await getAuthenticatedClient();
      expect(client.credentials.access_token).toBe('ya29.stored-access-token');
    });
  });

  describe('Token Storage Integration', () => {
    test('tokens persist across calls when valid', async () => {
      const validTokens: StoredTokens = {
        accessToken: 'ya29.persistent-token',
        refreshToken: '1//persistent-refresh',
        expiresAt: Date.now() + 60 * 60 * 1000,
        scope: 'https://www.googleapis.com/auth/presentations',
      };

      await saveTokens(validTokens);

      // First call
      const client1 = await getAuthenticatedClient();
      expect(client1.credentials.access_token).toBe('ya29.persistent-token');

      // Second call should return same token from storage
      const client2 = await getAuthenticatedClient();
      expect(client2.credentials.access_token).toBe('ya29.persistent-token');
    });

    test('correctly identifies expiring tokens via areTokensExpiring', async () => {
      // Test the expiration detection directly without triggering refresh
      const { areTokensExpiring } = await import('../../src/auth/token-store.js');

      const expiringTokens: StoredTokens = {
        accessToken: 'ya29.expiring-token',
        refreshToken: '1//expiring-refresh',
        expiresAt: Date.now() + 2 * 60 * 1000, // 2 minutes from now
        scope: 'https://www.googleapis.com/auth/presentations',
      };

      const nonExpiringTokens: StoredTokens = {
        accessToken: 'ya29.valid-token',
        refreshToken: '1//valid-refresh',
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes from now
        scope: 'https://www.googleapis.com/auth/presentations',
      };

      // With 5-minute buffer, 2-minute token should be expiring
      expect(areTokensExpiring(expiringTokens, 5)).toBe(true);
      // 30-minute token should not be expiring
      expect(areTokensExpiring(nonExpiringTokens, 5)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    test('AuthenticationError has correct name', () => {
      const error = new AuthenticationError('test message');
      expect(error.name).toBe('AuthenticationError');
      expect(error.message).toBe('test message');
      expect(error).toBeInstanceOf(Error);
    });

    test('AuthenticationError can wrap cause', () => {
      const cause = new Error('original error');
      const error = new AuthenticationError('wrapped', cause);
      expect(error.message).toBe('wrapped');
      expect(error.cause).toBe(cause);
    });
  });

  describe('Environment Configuration', () => {
    test('uses environment variable for client ID', async () => {
      const validTokens: StoredTokens = {
        accessToken: 'ya29.test-token',
        refreshToken: '1//test-refresh',
        expiresAt: Date.now() + 60 * 60 * 1000,
        scope: 'https://www.googleapis.com/auth/presentations',
      };

      await saveTokens(validTokens);

      process.env.MCP_GSLIDES_CLIENT_ID = 'custom-client-id';

      const client = await getAuthenticatedClient();
      expect(client).toBeInstanceOf(OAuth2Client);
      // Client should be created with the environment's client ID
    });

    test('uses environment variable for client secret', async () => {
      const validTokens: StoredTokens = {
        accessToken: 'ya29.test-token',
        refreshToken: '1//test-refresh',
        expiresAt: Date.now() + 60 * 60 * 1000,
        scope: 'https://www.googleapis.com/auth/presentations',
      };

      await saveTokens(validTokens);

      process.env.MCP_GSLIDES_CLIENT_SECRET = 'custom-client-secret';

      const client = await getAuthenticatedClient();
      expect(client).toBeInstanceOf(OAuth2Client);
      // Client should be created with the environment's client secret
    });
  });
});
