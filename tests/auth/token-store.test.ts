/**
 * Integration tests for token storage
 */

import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  areTokensExpiring,
  deleteTokens,
  getTokenPath,
  loadTokens,
  saveTokens,
} from '../../src/auth/token-store.js';
import type { StoredTokens } from '../../src/types/common.js';

describe('Token Storage', () => {
  let testDir: string;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    // Create a temporary directory for test tokens
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-gslides-test-'));
    const testTokenPath = path.join(testDir, 'tokens.json');

    // Set the environment variable to use our test directory
    originalEnv = process.env.MCP_GSLIDES_TOKEN_PATH;
    process.env.MCP_GSLIDES_TOKEN_PATH = testTokenPath;
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (_error) {
      // Ignore cleanup errors
    }

    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.MCP_GSLIDES_TOKEN_PATH = originalEnv;
    } else {
      delete process.env.MCP_GSLIDES_TOKEN_PATH;
    }
  });

  describe('getTokenPath', () => {
    test('returns custom path from environment variable', () => {
      const customPath = '/custom/path/tokens.json';
      process.env.MCP_GSLIDES_TOKEN_PATH = customPath;
      expect(getTokenPath()).toBe(path.resolve(customPath));
    });

    test('returns default path when no environment variable', () => {
      delete process.env.MCP_GSLIDES_TOKEN_PATH;
      const expectedPath = path.join(os.homedir(), '.mcp-google-slides', 'tokens.json');
      expect(getTokenPath()).toBe(expectedPath);
    });
  });

  describe('saveTokens and loadTokens', () => {
    const validTokens: StoredTokens = {
      accessToken: 'ya29.a0...',
      refreshToken: '1//0e...',
      expiresAt: Date.now() + 3600000, // 1 hour from now
      scope: 'https://www.googleapis.com/auth/presentations',
    };

    test('saves and loads valid tokens', async () => {
      await saveTokens(validTokens);
      const loadedTokens = await loadTokens();

      expect(loadedTokens).toEqual(validTokens);
    });

    test('creates directory if it does not exist', async () => {
      // Delete the test directory
      await fs.rm(testDir, { recursive: true, force: true });

      // Recreate parent directory but not the tokens subdirectory
      testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-gslides-test-'));
      const nestedPath = path.join(testDir, 'nested', 'path', 'tokens.json');
      process.env.MCP_GSLIDES_TOKEN_PATH = nestedPath;

      // Should create all necessary directories
      await saveTokens(validTokens);
      const loadedTokens = await loadTokens();

      expect(loadedTokens).toEqual(validTokens);
    });

    test('sets correct file permissions (0600)', async () => {
      await saveTokens(validTokens);
      const stats = await fs.stat(getTokenPath());

      // On Unix-like systems, check file mode
      if (process.platform !== 'win32') {
        const mode = stats.mode & 0o777;
        expect(mode).toBe(0o600);
      }
    });

    test('returns null when token file does not exist', async () => {
      const tokens = await loadTokens();
      expect(tokens).toBeNull();
    });

    test('returns null when token file has invalid JSON', async () => {
      const tokenPath = getTokenPath();
      await fs.mkdir(path.dirname(tokenPath), { recursive: true });
      await fs.writeFile(tokenPath, 'invalid json{', 'utf-8');

      const tokens = await loadTokens();
      expect(tokens).toBeNull();
    });

    test('returns null when token file is missing required fields', async () => {
      const incompleteTokens = {
        accessToken: 'ya29.a0...',
        // Missing refreshToken, expiresAt, scope
      };

      const tokenPath = getTokenPath();
      await fs.mkdir(path.dirname(tokenPath), { recursive: true });
      await fs.writeFile(tokenPath, JSON.stringify(incompleteTokens), 'utf-8');

      const tokens = await loadTokens();
      expect(tokens).toBeNull();
    });

    test('properly formats JSON with indentation', async () => {
      await saveTokens(validTokens);
      const tokenPath = getTokenPath();
      const fileContent = await fs.readFile(tokenPath, 'utf-8');

      // Should be formatted with 2-space indentation
      expect(fileContent).toContain('\n  ');
      expect(JSON.parse(fileContent)).toEqual(validTokens);
    });
  });

  describe('deleteTokens', () => {
    const validTokens: StoredTokens = {
      accessToken: 'ya29.a0...',
      refreshToken: '1//0e...',
      expiresAt: Date.now() + 3600000,
      scope: 'https://www.googleapis.com/auth/presentations',
    };

    test('deletes existing token file', async () => {
      await saveTokens(validTokens);
      expect(await loadTokens()).toEqual(validTokens);

      await deleteTokens();
      expect(await loadTokens()).toBeNull();
    });

    test('does not throw when token file does not exist', async () => {
      // Should complete without throwing
      await deleteTokens();
      // If we get here, no error was thrown
      expect(true).toBe(true);
    });

    test('throws on other file system errors', async () => {
      // Create a directory where the token file should be (will cause EISDIR error)
      const tokenPath = getTokenPath();
      await fs.mkdir(path.dirname(tokenPath), { recursive: true });
      await fs.mkdir(tokenPath, { recursive: true }); // Make tokenPath a directory

      await expect(deleteTokens()).rejects.toThrow();
    });
  });

  describe('areTokensExpiring', () => {
    test('returns false for tokens expiring in more than buffer time', () => {
      const tokens: StoredTokens = {
        accessToken: 'ya29.a0...',
        refreshToken: '1//0e...',
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes from now
        scope: 'https://www.googleapis.com/auth/presentations',
      };

      expect(areTokensExpiring(tokens, 5)).toBe(false); // 5 minute buffer
    });

    test('returns true for tokens expiring within buffer time', () => {
      const tokens: StoredTokens = {
        accessToken: 'ya29.a0...',
        refreshToken: '1//0e...',
        expiresAt: Date.now() + 3 * 60 * 1000, // 3 minutes from now
        scope: 'https://www.googleapis.com/auth/presentations',
      };

      expect(areTokensExpiring(tokens, 5)).toBe(true); // 5 minute buffer
    });

    test('returns true for already expired tokens', () => {
      const tokens: StoredTokens = {
        accessToken: 'ya29.a0...',
        refreshToken: '1//0e...',
        expiresAt: Date.now() - 1000, // 1 second ago
        scope: 'https://www.googleapis.com/auth/presentations',
      };

      expect(areTokensExpiring(tokens, 5)).toBe(true);
    });

    test('uses default 5 minute buffer when not specified', () => {
      const tokens: StoredTokens = {
        accessToken: 'ya29.a0...',
        refreshToken: '1//0e...',
        expiresAt: Date.now() + 6 * 60 * 1000, // 6 minutes from now
        scope: 'https://www.googleapis.com/auth/presentations',
      };

      expect(areTokensExpiring(tokens)).toBe(false); // Default 5 minute buffer
    });

    test('handles edge case at exact buffer boundary', () => {
      const tokens: StoredTokens = {
        accessToken: 'ya29.a0...',
        refreshToken: '1//0e...',
        expiresAt: Date.now() + 5 * 60 * 1000, // Exactly 5 minutes from now
        scope: 'https://www.googleapis.com/auth/presentations',
      };

      // Should return true because expiresAt <= (now + buffer)
      expect(areTokensExpiring(tokens, 5)).toBe(true);
    });
  });
});
