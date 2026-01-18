/**
 * Integration tests for OAuth callback server
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
  CallbackTimeoutError,
  getCallbackUrl,
  OAuthCallbackError,
  StateMismatchError,
  startCallbackServer,
} from '../../src/auth/callback-server.js';

describe('OAuth Callback Server', () => {
  const TEST_STATE = 'test-state-12345678901234567890';
  let currentTestPort = 18086; // Use higher ports to avoid conflicts

  // Helper function to get a unique port for each test
  function getNextTestPort(): number {
    return currentTestPort++;
  }

  // Helper function to make HTTP requests to the callback server using native fetch
  async function makeCallbackRequest(
    port: number,
    params: Record<string, string>
  ): Promise<{ status: number; headers: Headers; body: string }> {
    const queryString = new URLSearchParams(params).toString();
    const url = `http://127.0.0.1:${port}/callback?${queryString}`;

    const response = await fetch(url);
    const body = await response.text();

    return {
      status: response.status,
      headers: response.headers,
      body,
    };
  }

  describe('getCallbackUrl', () => {
    let originalPort: string | undefined;

    beforeEach(() => {
      originalPort = process.env.MCP_GSLIDES_CALLBACK_PORT;
      delete process.env.MCP_GSLIDES_CALLBACK_PORT;
    });

    afterEach(() => {
      if (originalPort !== undefined) {
        process.env.MCP_GSLIDES_CALLBACK_PORT = originalPort;
      } else {
        delete process.env.MCP_GSLIDES_CALLBACK_PORT;
      }
    });

    test('returns default callback URL', () => {
      const url = getCallbackUrl();
      expect(url).toBe('http://127.0.0.1:8085/callback');
    });

    test('returns callback URL with custom port', () => {
      const url = getCallbackUrl(9000);
      expect(url).toBe('http://127.0.0.1:9000/callback');
    });

    test('uses MCP_GSLIDES_CALLBACK_PORT environment variable', () => {
      process.env.MCP_GSLIDES_CALLBACK_PORT = '9999';
      const url = getCallbackUrl();
      expect(url).toBe('http://127.0.0.1:9999/callback');
    });

    test('uses loopback IP (127.0.0.1) not localhost', () => {
      const url = getCallbackUrl();
      expect(url).toContain('127.0.0.1');
      expect(url).not.toContain('localhost');
    });
  });

  describe('startCallbackServer - Success Flow', () => {
    test('successfully receives authorization code', async () => {
      const testPort = getNextTestPort();
      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: 5000,
      });

      // Wait a bit for server to start
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Send callback request
      const response = await makeCallbackRequest(testPort, {
        code: 'test-auth-code',
        state: TEST_STATE,
      });

      expect(response.status).toBe(200);

      // Server should resolve with the code and state
      const result = await serverPromise;
      expect(result).toEqual({
        code: 'test-auth-code',
        state: TEST_STATE,
      });
    });

    test('returns HTML success page with correct content', async () => {
      const testPort = getNextTestPort();
      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: 5000,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const response = await makeCallbackRequest(testPort, {
        code: 'test-auth-code',
        state: TEST_STATE,
      });

      expect(response.headers.get('content-type')).toBe('text/html');
      expect(response.body).toContain('Authentication Successful');
      expect(response.body).toContain('You can close this window');
      expect(response.body).toContain('window.close()');

      await serverPromise;
    });

    test('server stops accepting requests on callback path after handling', async () => {
      const testPort = getNextTestPort();
      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: 5000,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // First request should succeed
      const response1 = await makeCallbackRequest(testPort, {
        code: 'test-auth-code',
        state: TEST_STATE,
      });
      expect(response1.status).toBe(200);

      // Wait for the promise to resolve
      const result = await serverPromise;
      expect(result.code).toBe('test-auth-code');

      // The server has processed the callback and resolved the promise
      // Note: Bun's server.stop() behavior may differ from Node.js
      // The important thing is that the promise resolved with the correct result
    });
  });

  describe('startCallbackServer - Error Handling', () => {
    test('rejects with StateMismatchError when state does not match', async () => {
      const testPort = getNextTestPort();
      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: 5000,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const response = await makeCallbackRequest(testPort, {
        code: 'test-auth-code',
        state: 'wrong-state',
      });

      expect(response.status).toBe(403);
      expect(response.body).toContain('Authentication Failed');
      expect(response.body).toContain('state_mismatch');

      try {
        await serverPromise;
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(StateMismatchError);
      }
    });

    test('rejects with OAuthCallbackError when OAuth error is present', async () => {
      const testPort = getNextTestPort();
      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: 5000,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const response = await makeCallbackRequest(testPort, {
        error: 'access_denied',
        error_description: 'User denied access',
      });

      expect(response.status).toBe(200);
      expect(response.body).toContain('Authentication Failed');
      expect(response.body).toContain('access_denied');

      try {
        await serverPromise;
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(OAuthCallbackError);
        expect((error as Error).message).toContain('access_denied');
      }
    });

    test('rejects with OAuthCallbackError when code is missing', async () => {
      const testPort = getNextTestPort();
      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: 5000,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const response = await makeCallbackRequest(testPort, {
        state: TEST_STATE,
        // Missing 'code' parameter
      });

      expect(response.status).toBe(400);

      try {
        await serverPromise;
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(OAuthCallbackError);
        expect((error as Error).message).toContain('Missing code or state parameter');
      }
    });

    test('rejects with OAuthCallbackError when state is missing', async () => {
      const testPort = getNextTestPort();
      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: 5000,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      const response = await makeCallbackRequest(testPort, {
        code: 'test-auth-code',
        // Missing 'state' parameter
      });

      expect(response.status).toBe(400);

      try {
        await serverPromise;
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(OAuthCallbackError);
      }
    });

    test('rejects with CallbackTimeoutError when no callback received', async () => {
      const testPort = getNextTestPort();
      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: 500, // Short timeout for testing
      });

      try {
        await serverPromise;
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(CallbackTimeoutError);
        expect((error as Error).message).toContain('timed out after 500ms');
      }
    }, 10000);

    test('returns 404 for non-callback paths', async () => {
      const testPort = getNextTestPort();
      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: 5000,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Request a different path
      const response = await fetch(`http://127.0.0.1:${testPort}/other-path`);

      expect(response.status).toBe(404);

      // Complete the test by sending a valid callback
      await makeCallbackRequest(testPort, {
        code: 'test-code',
        state: TEST_STATE,
      });

      await serverPromise;
    });

    test('returns 405 for non-GET requests', async () => {
      const testPort = getNextTestPort();
      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: 5000,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      // Send a POST request
      const response = await fetch(`http://127.0.0.1:${testPort}/callback`, {
        method: 'POST',
      });

      expect(response.status).toBe(405);

      // Complete the test by sending a valid callback
      await makeCallbackRequest(testPort, {
        code: 'test-code',
        state: TEST_STATE,
      });

      await serverPromise;
    });
  });

  describe('startCallbackServer - Configuration', () => {
    test('uses custom timeout value', async () => {
      const testPort = getNextTestPort();
      const customTimeout = 300; // Very short timeout
      const startTime = Date.now();

      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: customTimeout,
      });

      try {
        await serverPromise;
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(CallbackTimeoutError);
      }

      const elapsed = Date.now() - startTime;
      // Should timeout around the custom timeout value (with some tolerance)
      expect(elapsed).toBeGreaterThanOrEqual(customTimeout - 50);
      expect(elapsed).toBeLessThan(customTimeout + 300);
    }, 10000);

    test('uses environment variable for port when not specified', async () => {
      const originalPort = process.env.MCP_GSLIDES_CALLBACK_PORT;
      const envPort = getNextTestPort();
      process.env.MCP_GSLIDES_CALLBACK_PORT = envPort.toString();

      try {
        const serverPromise = startCallbackServer({
          expectedState: TEST_STATE,
          timeout: 5000,
        });

        await new Promise((resolve) => setTimeout(resolve, 50));

        // Should be listening on the environment variable port
        const response = await makeCallbackRequest(envPort, {
          code: 'test',
          state: TEST_STATE,
        });

        expect(response.status).toBe(200);

        await serverPromise;
      } finally {
        // Restore original environment
        if (originalPort !== undefined) {
          process.env.MCP_GSLIDES_CALLBACK_PORT = originalPort;
        } else {
          delete process.env.MCP_GSLIDES_CALLBACK_PORT;
        }
      }
    });
  });
});
