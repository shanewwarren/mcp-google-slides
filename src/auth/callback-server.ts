/**
 * Local HTTP server for handling OAuth callbacks
 *
 * Creates a temporary HTTP server on localhost (127.0.0.1) to receive
 * the OAuth authorization code from Google after user consent.
 *
 * Uses Bun.serve() for native HTTP handling.
 */

import type { Server } from 'bun';

/**
 * Result from the OAuth callback
 */
export interface CallbackResult {
  /** Authorization code from Google */
  code: string;
  /** State parameter (for CSRF validation) */
  state: string;
}

/**
 * Configuration for the callback server
 */
export interface CallbackServerConfig {
  /** Port to listen on (default: 8085) */
  port?: number;
  /** Expected state value for CSRF protection */
  expectedState: string;
  /** Timeout in milliseconds (default: 120000 = 2 minutes) */
  timeout?: number;
}

/**
 * Error thrown when the OAuth callback times out
 */
export class CallbackTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`OAuth callback timed out after ${timeoutMs}ms`);
    this.name = 'CallbackTimeoutError';
  }
}

/**
 * Error thrown when state parameter doesn't match (CSRF attack)
 */
export class StateMismatchError extends Error {
  constructor() {
    super('State parameter mismatch - possible CSRF attack');
    this.name = 'StateMismatchError';
  }
}

/**
 * Error thrown when the callback request contains an error
 */
export class OAuthCallbackError extends Error {
  constructor(error: string, description?: string) {
    const message = description
      ? `OAuth error: ${error} - ${description}`
      : `OAuth error: ${error}`;
    super(message);
    this.name = 'OAuthCallbackError';
  }
}

// HTML page shown to user after successful authentication
const successHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authentication Complete</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 400px;
    }
    h1 {
      color: #2d3748;
      margin: 0 0 1rem 0;
      font-size: 2rem;
    }
    p {
      color: #4a5568;
      margin: 0;
      font-size: 1.1rem;
      line-height: 1.6;
    }
    .checkmark {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="checkmark">✓</div>
    <h1>Authentication Successful!</h1>
    <p>You can close this window and return to your application.</p>
  </div>
  <script>
    // Attempt to close the window after a short delay
    setTimeout(() => window.close(), 1500);
  </script>
</body>
</html>`;

// HTML page shown when there's an error
function errorHtml(error: string, description: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authentication Failed</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
    .container {
      background: white;
      padding: 3rem;
      border-radius: 1rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      text-align: center;
      max-width: 400px;
    }
    h1 {
      color: #2d3748;
      margin: 0 0 1rem 0;
      font-size: 2rem;
    }
    p {
      color: #4a5568;
      margin: 0;
      font-size: 1.1rem;
      line-height: 1.6;
    }
    .error-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    code {
      background: #f7fafc;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-icon">✗</div>
    <h1>Authentication Failed</h1>
    <p><strong>Error:</strong> <code>${error}</code></p>
    <p style="margin-top: 1rem;">${description}</p>
  </div>
</body>
</html>`;
}

/**
 * Start a local HTTP server to receive the OAuth callback
 *
 * The server listens for a single callback request, validates the state
 * parameter, and returns the authorization code. The server automatically
 * shuts down after receiving the callback or timing out.
 *
 * @param config - Configuration for the callback server
 * @returns Promise that resolves with the callback result
 * @throws {CallbackTimeoutError} If no callback is received within the timeout
 * @throws {StateMismatchError} If the state parameter doesn't match
 * @throws {OAuthCallbackError} If the callback contains an error
 */
export async function startCallbackServer(config: CallbackServerConfig): Promise<CallbackResult> {
  const port = config.port ?? parseInt(process.env.MCP_GSLIDES_CALLBACK_PORT || '8085', 10);
  const timeout = config.timeout ?? 120000; // 2 minutes default

  return new Promise((resolve, reject) => {
    let timeoutHandle: ReturnType<typeof setTimeout>;
    let server: Server;
    let settled = false;

    // Cleanup function to close server and clear timeout
    const cleanup = () => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      if (server) {
        server.stop();
      }
    };

    // Helper to settle the promise only once
    // Delays cleanup to allow the Response to be sent first
    const settleOnce = (fn: typeof resolve | typeof reject, value: CallbackResult | Error) => {
      if (!settled) {
        settled = true;
        // Use setImmediate-like behavior to let the Response be sent first
        setTimeout(() => {
          cleanup();
          fn(value as CallbackResult & Error);
        }, 0);
      }
    };

    // Create HTTP server using Bun.serve
    server = Bun.serve({
      port,
      hostname: '127.0.0.1',

      fetch(req) {
        // Only handle GET requests
        if (req.method !== 'GET') {
          return new Response('Method Not Allowed', { status: 405 });
        }

        // Parse URL and query parameters
        const url = new URL(req.url);

        // Check if this is the callback path
        if (!url.pathname.startsWith('/callback')) {
          return new Response('Not Found', { status: 404 });
        }

        // Extract code, state, and error from query parameters
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        // Handle OAuth errors (user denied consent, etc.)
        if (error) {
          settleOnce(reject, new OAuthCallbackError(error, errorDescription || undefined));
          return new Response(
            errorHtml(error, errorDescription || 'Authentication was not successful'),
            {
              status: 200,
              headers: { 'Content-Type': 'text/html' },
            }
          );
        }

        // Validate that we have both code and state
        if (!code || !state) {
          settleOnce(
            reject,
            new OAuthCallbackError('invalid_request', 'Missing code or state parameter')
          );
          return new Response(errorHtml('invalid_request', 'Missing required parameters'), {
            status: 400,
            headers: { 'Content-Type': 'text/html' },
          });
        }

        // Validate state parameter (CSRF protection)
        if (state !== config.expectedState) {
          settleOnce(reject, new StateMismatchError());
          return new Response(errorHtml('state_mismatch', 'Possible CSRF attack detected'), {
            status: 403,
            headers: { 'Content-Type': 'text/html' },
          });
        }

        // Success! Send success page and resolve with the code
        settleOnce(resolve, { code, state });
        return new Response(successHtml, {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        });
      },

      error(err) {
        settleOnce(reject, err);
        return new Response('Internal Server Error', { status: 500 });
      },
    });

    // Set up timeout
    timeoutHandle = setTimeout(() => {
      settleOnce(reject, new CallbackTimeoutError(timeout));
    }, timeout);
  });
}

/**
 * Get the callback URL for the OAuth flow
 *
 * @param port - Port number (default: 8085)
 * @returns The full callback URL
 */
export function getCallbackUrl(port?: number): string {
  const actualPort = port ?? parseInt(process.env.MCP_GSLIDES_CALLBACK_PORT || '8085', 10);
  return `http://127.0.0.1:${actualPort}/callback`;
}
