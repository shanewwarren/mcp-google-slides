# OAuth Authentication Specification

**Status:** Planned
**Version:** 1.0
**Last Updated:** 2025-01-17

---

## 1. Overview

### Purpose

Provides seamless Google OAuth 2.1 authentication with PKCE for the MCP server, eliminating the need for users to manually create API keys or service accounts. When a user first invokes any tool, the server automatically opens a browser for Google consent, stores tokens locally, and handles refresh automatically.

### Goals

- **Zero-config authentication** - Users authenticate via browser popup, no API key setup required
- **Automatic token refresh** - Access tokens refresh transparently before expiration
- **Secure token storage** - Credentials stored locally with appropriate file permissions
- **Session persistence** - Tokens survive server restarts

### Non-Goals

- **Service account support** - This server is for personal use, not server-to-server auth
- **Multi-user token management** - Single user per installation
- **Custom OAuth providers** - Google OAuth only

---

## 2. Architecture

### Component Structure

```
src/
├── auth/
│   ├── oauth-client.ts       # OAuth2 client wrapper
│   ├── token-store.ts        # Persistent token storage
│   ├── callback-server.ts    # Local HTTP server for OAuth callback
│   └── index.ts              # Auth module exports
└── index.ts                  # MCP server entry point
```

### Component Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   MCP Client    │────▶│   MCP Server    │────▶│  Google OAuth   │
│ (Claude, etc.)  │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                        │
                               ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  Token Store    │     │  User Browser   │
                        │ (~/.mcp-gslides)│     │ (consent flow)  │
                        └─────────────────┘     └─────────────────┘
```

### Data Flow

1. Tool invoked → Check token store for valid access token
2. If no token or expired → Generate PKCE challenge, start local callback server
3. Open browser to Google consent URL with PKCE verifier
4. User grants consent → Google redirects to localhost callback
5. Exchange auth code for tokens → Store tokens → Close callback server
6. Return authenticated client to caller

---

## 3. Core Types

### 3.1 StoredTokens

Represents the persisted OAuth tokens.

```typescript
interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;      // Unix timestamp in milliseconds
  scope: string;
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| accessToken | string | Yes | Current access token for API calls |
| refreshToken | string | Yes | Long-lived token for obtaining new access tokens |
| expiresAt | number | Yes | Expiration timestamp (ms since epoch) |
| scope | string | Yes | Granted OAuth scopes |

### 3.2 OAuthConfig

Configuration for the OAuth client.

```typescript
interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| clientId | string | Yes | Google Cloud OAuth client ID (bundled with server) |
| clientSecret | string | Yes | Google Cloud OAuth client secret |
| redirectUri | string | Yes | Callback URL, typically `http://localhost:PORT/callback` |
| scopes | string[] | Yes | Required OAuth scopes |

### 3.3 AuthState

Runtime authentication state.

```typescript
interface AuthState {
  status: 'unauthenticated' | 'pending' | 'authenticated';
  pendingChallenge?: {
    verifier: string;
    state: string;
  };
}
```

---

## 4. API / Behaviors

### 4.1 getAuthenticatedClient

**Purpose:** Returns an authenticated Google API client, triggering OAuth flow if needed.

```typescript
async function getAuthenticatedClient(): Promise<OAuth2Client>
```

**Behavior:**
1. Check token store for valid tokens
2. If valid token exists and not expiring soon → return client
3. If token expiring within 5 minutes → refresh token
4. If no token → trigger interactive OAuth flow
5. Return configured OAuth2Client

**Errors:**

| Error | Reason |
|-------|--------|
| AuthFlowCancelled | User closed browser or denied consent |
| TokenRefreshFailed | Refresh token revoked or expired |
| CallbackTimeout | No callback received within 2 minutes |

### 4.2 startOAuthFlow

**Purpose:** Initiates the browser-based OAuth consent flow.

```typescript
async function startOAuthFlow(): Promise<StoredTokens>
```

**Flow:**
1. Generate PKCE code verifier (43-128 chars, URL-safe)
2. Generate code challenge (SHA256 hash, base64url encoded)
3. Generate state parameter (random string for CSRF protection)
4. Start local HTTP server on available port (default: 8085)
5. Open browser to Google authorization URL
6. Wait for callback with auth code
7. Exchange code for tokens
8. Store tokens and return

### 4.3 refreshAccessToken

**Purpose:** Refreshes an expired or expiring access token.

```typescript
async function refreshAccessToken(refreshToken: string): Promise<StoredTokens>
```

**Behavior:**
- Uses refresh token to obtain new access token
- Updates stored tokens
- Returns new token set

---

## 5. Google OAuth Endpoints

### Authorization Endpoint

```
https://accounts.google.com/o/oauth2/v2/auth
```

**Required Parameters:**

| Parameter | Value |
|-----------|-------|
| `client_id` | Bundled OAuth client ID |
| `redirect_uri` | `http://127.0.0.1:{port}` (loopback IP, not localhost) |
| `response_type` | `code` |
| `scope` | Space-delimited scopes |
| `code_challenge` | Base64URL-encoded SHA256 of code_verifier |
| `code_challenge_method` | `S256` |
| `state` | Random CSRF token |
| `access_type` | `offline` (to receive refresh token) |

### Token Endpoint

```
https://oauth2.googleapis.com/token
```

**Token Exchange Request:**

```
POST /token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

code={authorization_code}
client_id={client_id}
client_secret={client_secret}
redirect_uri={redirect_uri}
grant_type=authorization_code
code_verifier={code_verifier}
```

**Token Response:**

```json
{
  "access_token": "ya29.a0...",
  "expires_in": 3599,
  "refresh_token": "1//0e...",
  "scope": "https://www.googleapis.com/auth/presentations",
  "token_type": "Bearer"
}
```

### Token Refresh Request

```
POST /token HTTP/1.1
Content-Type: application/x-www-form-urlencoded

client_id={client_id}
client_secret={client_secret}
refresh_token={refresh_token}
grant_type=refresh_token
```

### Token Revocation (optional)

```
POST https://oauth2.googleapis.com/revoke?token={token}
```

---

## 6. PKCE Implementation

PKCE (Proof Key for Code Exchange) is **required** for desktop/native apps to prevent authorization code interception.

### Code Verifier Generation

```typescript
function generateCodeVerifier(): string {
  // 43-128 characters from: [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~"
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}
```

### Code Challenge Generation

```typescript
function generateCodeChallenge(verifier: string): string {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64UrlEncode(hash);
}
```

### Base64URL Encoding

```typescript
function base64UrlEncode(buffer: Buffer | Uint8Array): string {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
```

---

## 7. Loopback Redirect Server

### Why 127.0.0.1 (not localhost)

- Use `http://127.0.0.1:{port}` instead of `http://localhost:{port}`
- `localhost` can cause issues with some client firewalls
- Loopback IP flow is fully supported for Desktop app OAuth client types

### Callback Handling

When the callback is received:
1. Parse the `code` and `state` from query parameters
2. Verify `state` matches the original request (CSRF protection)
3. Respond with an HTML page instructing user to close the browser
4. Exchange the code for tokens
5. Shut down the callback server

### Success Response HTML

```html
<!DOCTYPE html>
<html>
<head><title>Authentication Complete</title></head>
<body>
  <h1>Authentication successful!</h1>
  <p>You can close this window and return to your application.</p>
  <script>window.close();</script>
</body>
</html>
```

---

## 8. Configuration

| Variable | Type | Description | Default |
|----------|------|-------------|---------|
| `MCP_GSLIDES_TOKEN_PATH` | string | Path to token storage file | `~/.mcp-google-slides/tokens.json` |
| `MCP_GSLIDES_CALLBACK_PORT` | number | Port for OAuth callback server | `8085` |

---

## 9. Security Considerations

### Authentication & Authorization

- **PKCE required** - Prevents authorization code interception attacks
- **State parameter** - CSRF protection for OAuth flow
- **Localhost callback only** - No external callback URLs accepted

### Data Protection

- **Token file permissions** - Store with 0600 permissions (owner read/write only)
- **No token logging** - Tokens never logged, even at debug level
- **Memory cleanup** - Clear sensitive data from memory after use

### Token Security

- **Refresh token rotation** - Accept rotated refresh tokens from Google
- **Scope minimization** - Request only `presentations` scope (not broader Drive access)
- **Token validation** - Verify token before each API call

---

## 10. Implementation Phases

| Phase | Description | Dependencies | Complexity |
|-------|-------------|--------------|------------|
| 1 | Token store (read/write/validate) | None | Low |
| 2 | OAuth client with PKCE | Phase 1 | Medium |
| 3 | Local callback server | Phase 2 | Medium |
| 4 | Browser launch integration | Phase 3 | Low |
| 5 | Automatic token refresh | Phase 1-4 | Low |

---

## 11. OAuth Scopes

The server requests the following scope:

| Scope | Description | Sensitivity |
|-------|-------------|-------------|
| `https://www.googleapis.com/auth/presentations` | Create, edit, delete presentations | Sensitive |
| `https://www.googleapis.com/auth/drive.file` | Access files created by this app | Non-sensitive |

The `drive.file` scope enables listing presentations created by this MCP server.

---

## 12. Dependencies

| Package | Purpose |
|---------|---------|
| `google-auth-library` | Google OAuth2 client |
| `googleapis` | Google Slides API client |
| `open` | Cross-platform browser launch |

---

## 13. Open Questions

- [x] Should we bundle OAuth credentials or require users to create their own? → **Bundle with server for zero-config experience**
- [ ] How to handle credential rotation if bundled credentials are compromised?

---

## 14. References

- [Google Workspace Auth Overview](https://developers.google.com/workspace/guides/auth-overview)
- [OAuth 2.0 for Desktop Apps](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Loopback IP Address Flow](https://developers.google.com/identity/protocols/oauth2/resources/loopback-migration)
- [Google Slides API Scopes](https://developers.google.com/workspace/slides/api/scopes)
