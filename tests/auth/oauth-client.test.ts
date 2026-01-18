/**
 * Integration tests for OAuth client
 *
 * Note: These tests mock the OAuth flow components to avoid requiring
 * real Google OAuth credentials and user interaction.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { OAuth2Client } from 'google-auth-library';
import {
  getAuthenticatedClient,
  AuthenticationError,
} from '../../src/auth/oauth-client.js';
import {
  loadTokens,
  saveTokens,
} from '../../src/auth/token-store.js';
import { StoredTokens } from '../../src/types/common.js';
import open from 'open';
import { startCallbackServer } from '../../src/auth/callback-server.js';

// Mock modules
jest.mock('../../src/auth/callback-server.js');

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

    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
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

    test('does not trigger OAuth flow when tokens are valid', async () => {
      const validTokens: StoredTokens = {
        accessToken: 'ya29.test-access-token',
        refreshToken: '1//test-refresh-token',
        expiresAt: Date.now() + 30 * 60 * 1000,
        scope: 'https://www.googleapis.com/auth/presentations',
      };

      await saveTokens(validTokens);

      await getAuthenticatedClient();

      // Should not call open() or startCallbackServer()
      expect(open).not.toHaveBeenCalled();
      expect(startCallbackServer).not.toHaveBeenCalled();
    });
  });

  describe('getAuthenticatedClient - Token Refresh', () => {
    test('refreshes tokens when expiring within 5 minutes', async () => {
      // Save tokens that will expire in 3 minutes
      const expiringTokens: StoredTokens = {
        accessToken: 'ya29.old-access-token',
        refreshToken: '1//test-refresh-token',
        expiresAt: Date.now() + 3 * 60 * 1000, // 3 minutes from now
        scope: 'https://www.googleapis.com/auth/presentations',
      };

      await saveTokens(expiringTokens);

      // Mock the OAuth2Client's refreshAccessToken method
      const mockRefreshAccessToken = jest.spyOn(OAuth2Client.prototype, 'refreshAccessToken');
      (mockRefreshAccessToken as any).mockResolvedValue({
        credentials: {
          access_token: 'ya29.new-access-token',
          refresh_token: '1//test-refresh-token',
          expiry_date: Date.now() + 3600000, // 1 hour from now
          scope: 'https://www.googleapis.com/auth/presentations',
        },
        res: null,
      });

      const client = await getAuthenticatedClient();

      expect(client).toBeInstanceOf(OAuth2Client);
      expect(mockRefreshAccessToken).toHaveBeenCalled();

      // Verify new tokens are saved
      const savedTokens = await loadTokens();
      expect(savedTokens?.accessToken).toBe('ya29.new-access-token');

      mockRefreshAccessToken.mockRestore();
    });

    test('falls back to OAuth flow when token refresh fails', async () => {
      // Save tokens that will expire soon
      const expiringTokens: StoredTokens = {
        accessToken: 'ya29.old-access-token',
        refreshToken: '1//expired-refresh-token',
        expiresAt: Date.now() + 3 * 60 * 1000,
        scope: 'https://www.googleapis.com/auth/presentations',
      };

      await saveTokens(expiringTokens);

      // Mock refresh to fail
      const mockRefreshAccessToken = jest.spyOn(OAuth2Client.prototype, 'refreshAccessToken');
      (mockRefreshAccessToken as any).mockRejectedValue(new Error('Refresh token expired'));

      // Mock successful OAuth flow
      const mockGetToken = jest.spyOn(OAuth2Client.prototype, 'getToken');
      (mockGetToken as any).mockResolvedValue({
        tokens: {
          access_token: 'ya29.new-access-token',
          refresh_token: '1//new-refresh-token',
          expiry_date: Date.now() + 3600000,
          scope: 'https://www.googleapis.com/auth/presentations',
        },
        res: null,
      });

      (startCallbackServer as jest.Mock).mockResolvedValue({
        code: 'test-auth-code',
        state: 'test-state',
      });

      const client = await getAuthenticatedClient();

      expect(client).toBeInstanceOf(OAuth2Client);
      expect(mockRefreshAccessToken).toHaveBeenCalled();
      expect(startCallbackServer).toHaveBeenCalled();
      expect(open).toHaveBeenCalled();

      // Verify new tokens are saved
      const savedTokens = await loadTokens();
      expect(savedTokens?.accessToken).toBe('ya29.new-access-token');
      expect(savedTokens?.refreshToken).toBe('1//new-refresh-token');

      mockRefreshAccessToken.mockRestore();
      mockGetToken.mockRestore();
    });
  });

  describe('getAuthenticatedClient - OAuth Flow', () => {
    test('triggers OAuth flow when no tokens exist', async () => {
      // No tokens saved - will trigger OAuth flow
      expect(await loadTokens()).toBeNull();

      // Mock successful OAuth flow
      const mockGetToken = jest.spyOn(OAuth2Client.prototype, 'getToken');
      (mockGetToken as any).mockResolvedValue({
        tokens: {
          access_token: 'ya29.new-access-token',
          refresh_token: '1//new-refresh-token',
          expiry_date: Date.now() + 3600000,
          scope: 'https://www.googleapis.com/auth/presentations',
        },
        res: null,
      });

      (startCallbackServer as jest.Mock).mockResolvedValue({
        code: 'test-auth-code',
        state: 'test-state',
      });

      const client = await getAuthenticatedClient();

      expect(client).toBeInstanceOf(OAuth2Client);
      expect(open).toHaveBeenCalled();
      expect(startCallbackServer).toHaveBeenCalled();
      expect(mockGetToken).toHaveBeenCalled();

      // Verify tokens are saved
      const savedTokens = await loadTokens();
      expect(savedTokens).not.toBeNull();
      expect(savedTokens?.accessToken).toBe('ya29.new-access-token');

      mockGetToken.mockRestore();
    });

    test('opens browser with correct authorization URL', async () => {
      const mockGetToken = jest.spyOn(OAuth2Client.prototype, 'getToken');
      (mockGetToken as any).mockResolvedValue({
        tokens: {
          access_token: 'ya29.new-access-token',
          refresh_token: '1//new-refresh-token',
          expiry_date: Date.now() + 3600000,
          scope: 'https://www.googleapis.com/auth/presentations',
        },
        res: null,
      });

      (startCallbackServer as jest.Mock).mockResolvedValue({
        code: 'test-auth-code',
        state: 'test-state',
      });

      await getAuthenticatedClient();

      expect(open).toHaveBeenCalled();
      const authUrl = (open as jest.Mock).mock.calls[0][0] as string;

      // Verify URL contains required OAuth parameters
      expect(authUrl).toContain('accounts.google.com/o/oauth2/v2/auth');
      expect(authUrl).toContain('client_id');
      expect(authUrl).toContain('access_type=offline');
      expect(authUrl).toContain('prompt=consent');
      expect(authUrl).toContain('code_challenge_method=S256');
      expect(authUrl).toContain('code_challenge=');
      expect(authUrl).toContain('state=');

      mockGetToken.mockRestore();
    });

    test('exchanges authorization code for tokens with PKCE verifier', async () => {
      const mockGetToken = jest.spyOn(OAuth2Client.prototype, 'getToken');
      (mockGetToken as any).mockResolvedValue({
        tokens: {
          access_token: 'ya29.new-access-token',
          refresh_token: '1//new-refresh-token',
          expiry_date: Date.now() + 3600000,
          scope: 'https://www.googleapis.com/auth/presentations',
        },
        res: null,
      });

      (startCallbackServer as jest.Mock).mockResolvedValue({
        code: 'test-auth-code-12345',
        state: 'test-state',
      });

      await getAuthenticatedClient();

      expect(mockGetToken).toHaveBeenCalledWith({
        code: 'test-auth-code-12345',
        codeVerifier: expect.any(String),
      });

      // Verify code verifier is 43 characters (32 bytes as base64url)
      const codeVerifier = (mockGetToken.mock.calls[0]?.[0] as any)?.codeVerifier;
      expect(codeVerifier).toHaveLength(43);

      mockGetToken.mockRestore();
    });

    test('throws AuthenticationError when OAuth flow fails', async () => {
      (startCallbackServer as jest.Mock).mockRejectedValue(
        new Error('User cancelled authorization')
      );

      await expect(getAuthenticatedClient()).rejects.toThrow(AuthenticationError);
      await expect(getAuthenticatedClient()).rejects.toThrow(
        'Failed to complete OAuth authentication'
      );
    });

    test('throws AuthenticationError when token exchange fails', async () => {
      const mockGetToken = jest.spyOn(OAuth2Client.prototype, 'getToken');
      (mockGetToken as any).mockRejectedValue(new Error('Invalid authorization code'));

      (startCallbackServer as jest.Mock).mockResolvedValue({
        code: 'invalid-code',
        state: 'test-state',
      });

      await expect(getAuthenticatedClient()).rejects.toThrow(AuthenticationError);

      mockGetToken.mockRestore();
    });

    test('throws AuthenticationError when tokens are incomplete', async () => {
      const mockGetToken = jest.spyOn(OAuth2Client.prototype, 'getToken');
      (mockGetToken as any).mockResolvedValue({
        tokens: {
          access_token: 'ya29.new-access-token',
          // Missing refresh_token and expiry_date
        },
        res: null,
      });

      (startCallbackServer as jest.Mock).mockResolvedValue({
        code: 'test-auth-code',
        state: 'test-state',
      });

      await expect(getAuthenticatedClient()).rejects.toThrow(AuthenticationError);

      mockGetToken.mockRestore();
    });
  });

  describe('getAuthenticatedClient - Error Recovery', () => {
    test('continues to work after browser fails to open', async () => {
      // Mock browser open to fail
      (open as jest.Mock).mockRejectedValue(new Error('Browser not found'));

      const mockGetToken = jest.spyOn(OAuth2Client.prototype, 'getToken');
      (mockGetToken as any).mockResolvedValue({
        tokens: {
          access_token: 'ya29.new-access-token',
          refresh_token: '1//new-refresh-token',
          expiry_date: Date.now() + 3600000,
          scope: 'https://www.googleapis.com/auth/presentations',
        },
        res: null,
      });

      (startCallbackServer as jest.Mock).mockResolvedValue({
        code: 'test-auth-code',
        state: 'test-state',
      });

      // Should still complete OAuth flow even if browser doesn't open
      const client = await getAuthenticatedClient();

      expect(client).toBeInstanceOf(OAuth2Client);
      expect(startCallbackServer).toHaveBeenCalled();

      mockGetToken.mockRestore();
    });
  });

  describe('Token Persistence', () => {
    test('saves tokens after successful OAuth flow', async () => {
      const mockGetToken = jest.spyOn(OAuth2Client.prototype, 'getToken');
      (mockGetToken as any).mockResolvedValue({
        tokens: {
          access_token: 'ya29.test-token',
          refresh_token: '1//test-refresh',
          expiry_date: Date.now() + 3600000,
          scope: 'https://www.googleapis.com/auth/presentations',
        },
        res: null,
      });

      (startCallbackServer as jest.Mock).mockResolvedValue({
        code: 'test-code',
        state: 'test-state',
      });

      await getAuthenticatedClient();

      // Verify tokens were saved
      const savedTokens = await loadTokens();
      expect(savedTokens).not.toBeNull();
      expect(savedTokens?.accessToken).toBe('ya29.test-token');
      expect(savedTokens?.refreshToken).toBe('1//test-refresh');

      mockGetToken.mockRestore();
    });

    test('saves updated tokens after refresh', async () => {
      // Start with expiring tokens
      await saveTokens({
        accessToken: 'ya29.old-token',
        refreshToken: '1//test-refresh',
        expiresAt: Date.now() + 3 * 60 * 1000,
        scope: 'https://www.googleapis.com/auth/presentations',
      });

      const mockRefreshAccessToken = jest.spyOn(OAuth2Client.prototype, 'refreshAccessToken');
      (mockRefreshAccessToken as any).mockResolvedValue({
        credentials: {
          access_token: 'ya29.new-token',
          refresh_token: '1//test-refresh',
          expiry_date: Date.now() + 3600000,
          scope: 'https://www.googleapis.com/auth/presentations',
        },
        res: null,
      });

      await getAuthenticatedClient();

      // Verify new tokens were saved
      const savedTokens = await loadTokens();
      expect(savedTokens?.accessToken).toBe('ya29.new-token');

      mockRefreshAccessToken.mockRestore();
    });

    test('handles rotated refresh tokens', async () => {
      await saveTokens({
        accessToken: 'ya29.old-token',
        refreshToken: '1//old-refresh',
        expiresAt: Date.now() + 3 * 60 * 1000,
        scope: 'https://www.googleapis.com/auth/presentations',
      });

      const mockRefreshAccessToken = jest.spyOn(OAuth2Client.prototype, 'refreshAccessToken');
      (mockRefreshAccessToken as any).mockResolvedValue({
        credentials: {
          access_token: 'ya29.new-token',
          refresh_token: '1//new-refresh', // Rotated refresh token
          expiry_date: Date.now() + 3600000,
          scope: 'https://www.googleapis.com/auth/presentations',
        },
        res: null,
      });

      await getAuthenticatedClient();

      // Verify new refresh token was saved
      const savedTokens = await loadTokens();
      expect(savedTokens?.refreshToken).toBe('1//new-refresh');

      mockRefreshAccessToken.mockRestore();
    });
  });
});
