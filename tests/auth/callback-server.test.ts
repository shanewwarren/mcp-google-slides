/**
 * Integration tests for OAuth callback server
 */

import * as http from 'http';
import {
  startCallbackServer,
  getCallbackUrl,
  CallbackTimeoutError,
  StateMismatchError,
  OAuthCallbackError,
} from '../../src/auth/callback-server.js';

describe('OAuth Callback Server', () => {
  const TEST_STATE = 'test-state-12345678901234567890';
  let currentTestPort = 8086; // Starting port, will increment for each test

  // Helper function to get a unique port for each test
  function getNextTestPort(): number {
    return currentTestPort++;
  }

  // Helper function to make HTTP requests to the callback server
  async function makeCallbackRequest(port: number, params: Record<string, string>): Promise<http.IncomingMessage> {
    const queryString = new URLSearchParams(params).toString();
    const url = `http://127.0.0.1:${port}/callback?${queryString}`;

    return new Promise((resolve, reject) => {
      const req = http.get(url, (res) => {
        // Drain the response body to avoid hanging
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          (res as any).body = Buffer.concat(chunks).toString('utf-8');
          resolve(res);
        });
        res.on('error', reject);
      });
      req.on('error', reject);
      req.end();
    });
  }

  describe('getCallbackUrl', () => {
    test('returns default callback URL', () => {
      const url = getCallbackUrl();
      expect(url).toBe('http://127.0.0.1:8085/callback');
    });

    test('returns callback URL with custom port', () => {
      const url = getCallbackUrl(9000);
      expect(url).toBe('http://127.0.0.1:9000/callback');
    });

    test('uses MCP_GSLIDES_CALLBACK_PORT environment variable', () => {
      const originalPort = process.env.MCP_GSLIDES_CALLBACK_PORT;
      process.env.MCP_GSLIDES_CALLBACK_PORT = '9999';

      const url = getCallbackUrl();
      expect(url).toBe('http://127.0.0.1:9999/callback');

      // Restore original environment
      if (originalPort) {
        process.env.MCP_GSLIDES_CALLBACK_PORT = originalPort;
      } else {
        delete process.env.MCP_GSLIDES_CALLBACK_PORT;
      }
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
      await new Promise(resolve => setTimeout(resolve, 100));

      // Send callback request
      const response = await makeCallbackRequest(testPort, {
        code: 'test-auth-code',
        state: TEST_STATE,
      });

      expect(response.statusCode).toBe(200);

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

      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await makeCallbackRequest(testPort, {
        code: 'test-auth-code',
        state: TEST_STATE,
      });

      const html = (response as any).body;

      expect(response.headers['content-type']).toBe('text/html');
      expect(html).toContain('Authentication Successful');
      expect(html).toContain('You can close this window');
      expect(html).toContain('window.close()');

      await serverPromise;
    });

    test('server automatically shuts down after successful callback', async () => {
      const testPort = getNextTestPort();
      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: 5000,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      await makeCallbackRequest(testPort, {
        code: 'test-auth-code',
        state: TEST_STATE,
      });

      await serverPromise;

      // Wait for server to fully close and clean up connections
      await new Promise(resolve => setTimeout(resolve, 200));

      // Try to make another request - should fail because server is shut down
      // Create a new request without reusing connections
      await expect(
        new Promise<http.IncomingMessage>((resolve, reject) => {
          const req = http.request({
            hostname: '127.0.0.1',
            port: testPort,
            path: '/callback?code=another-code&state=' + TEST_STATE,
            method: 'GET',
            agent: false, // Disable connection pooling
          }, (res) => {
            res.on('data', () => {});
            res.on('end', () => resolve(res));
            res.on('error', reject);
          });
          req.on('error', reject);
          req.end();
        })
      ).rejects.toThrow();
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

      // Set up the expectation that the promise will reject
      const expectationPromise = expect(serverPromise).rejects.toThrow(StateMismatchError);

      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await makeCallbackRequest(testPort, {
        code: 'test-auth-code',
        state: 'wrong-state',
      });

      expect(response.statusCode).toBe(403);

      const html = (response as any).body;
      expect(html).toContain('Authentication Failed');
      expect(html).toContain('state_mismatch');

      await expectationPromise;
    });

    test('rejects with OAuthCallbackError when OAuth error is present', async () => {
      const testPort = getNextTestPort();
      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: 5000,
      });

      // Set up the expectations that the promise will reject
      const expectationPromise1 = expect(serverPromise).rejects.toThrow(OAuthCallbackError);
      const expectationPromise2 = expect(serverPromise).rejects.toThrow('access_denied');

      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await makeCallbackRequest(testPort, {
        error: 'access_denied',
        error_description: 'User denied access',
      });

      expect(response.statusCode).toBe(200);

      const html = (response as any).body;
      expect(html).toContain('Authentication Failed');
      expect(html).toContain('access_denied');

      await expectationPromise1;
      await expectationPromise2;
    });

    test('rejects with OAuthCallbackError when code is missing', async () => {
      const testPort = getNextTestPort();
      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: 5000,
      });

      // Set up the expectations that the promise will reject
      const expectationPromise1 = expect(serverPromise).rejects.toThrow(OAuthCallbackError);
      const expectationPromise2 = expect(serverPromise).rejects.toThrow('Missing code or state parameter');

      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await makeCallbackRequest(testPort, {
        state: TEST_STATE,
        // Missing 'code' parameter
      });

      expect(response.statusCode).toBe(400);

      await expectationPromise1;
      await expectationPromise2;
    });

    test('rejects with OAuthCallbackError when state is missing', async () => {
      const testPort = getNextTestPort();
      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: 5000,
      });

      // Set up the expectation that the promise will reject
      const expectationPromise = expect(serverPromise).rejects.toThrow(OAuthCallbackError);

      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await makeCallbackRequest(testPort, {
        code: 'test-auth-code',
        // Missing 'state' parameter
      });

      expect(response.statusCode).toBe(400);

      await expectationPromise;
    });

    test('rejects with CallbackTimeoutError when no callback received', async () => {
      const testPort = getNextTestPort();
      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: 500, // Short timeout for testing
      });

      await expect(serverPromise).rejects.toThrow(CallbackTimeoutError);
      await expect(serverPromise).rejects.toThrow('timed out after 500ms');
    }, 10000);

    test('returns 404 for non-callback paths', async () => {
      const testPort = getNextTestPort();
      const serverPromise = startCallbackServer({
        port: testPort,
        expectedState: TEST_STATE,
        timeout: 5000,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Request a different path
      const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
        const req = http.get(`http://127.0.0.1:${testPort}/other-path`, (res) => {
          // Drain response to avoid hanging
          res.on('data', () => {});
          res.on('end', () => resolve(res));
          res.on('error', reject);
        });
        req.on('error', reject);
        req.end();
      });

      expect(response.statusCode).toBe(404);

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

      await new Promise(resolve => setTimeout(resolve, 100));

      // Send a POST request
      const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
        const req = http.request({
          hostname: '127.0.0.1',
          port: testPort,
          path: '/callback',
          method: 'POST',
        }, (res) => {
          // Drain response to avoid hanging
          res.on('data', () => {});
          res.on('end', () => resolve(res));
          res.on('error', reject);
        });
        req.on('error', reject);
        req.end();
      });

      expect(response.statusCode).toBe(405);

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

      await expect(serverPromise).rejects.toThrow(CallbackTimeoutError);

      const elapsed = Date.now() - startTime;
      // Should timeout around the custom timeout value (with some tolerance)
      expect(elapsed).toBeGreaterThanOrEqual(customTimeout - 50);
      expect(elapsed).toBeLessThan(customTimeout + 200);
    }, 10000);

    test('uses environment variable for port when not specified', async () => {
      const originalPort = process.env.MCP_GSLIDES_CALLBACK_PORT;
      const envPort = getNextTestPort();
      process.env.MCP_GSLIDES_CALLBACK_PORT = envPort.toString();

      const serverPromise = startCallbackServer({
        expectedState: TEST_STATE,
        timeout: 5000,
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should be listening on the environment variable port
      const response = await makeCallbackRequest(envPort, {
        code: 'test',
        state: TEST_STATE,
      });

      expect(response.statusCode).toBe(200);

      await serverPromise;

      // Restore original environment
      if (originalPort) {
        process.env.MCP_GSLIDES_CALLBACK_PORT = originalPort;
      } else {
        delete process.env.MCP_GSLIDES_CALLBACK_PORT;
      }
    });
  });
});
