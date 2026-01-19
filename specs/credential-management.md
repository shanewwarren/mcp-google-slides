# Credential Management Specification

**Status:** Planned
**Version:** 1.0
**Last Updated:** 2026-01-18

---

## 1. Overview

### Purpose

Provides MCP tools for managing OAuth credentials, enabling users to clear stored tokens and switch between Google accounts without manually deleting files.

### Goals

- **Simple account switching** - Users can logout and re-authenticate with a different Google account
- **Discoverable** - Available as an MCP tool that LLMs can invoke when users ask to switch accounts

### Non-Goals

- **Multi-account support** - No simultaneous authentication with multiple Google accounts
- **Account selection UI** - No built-in account picker; relies on Google's OAuth consent flow
- **Token revocation** - Does not revoke tokens with Google (just clears local storage)

---

## 2. Architecture

### Component Structure

```
src/
├── auth/
│   └── token-store.ts        # Existing - deleteTokens() function
└── tools/
    └── auth/
        ├── index.ts          # Auth tools barrel export
        └── logout.ts         # Logout tool implementation
```

### Data Flow

1. User requests logout via LLM
2. LLM invokes `logout` MCP tool
3. Tool calls `deleteTokens()` from token-store
4. Returns confirmation message
5. Next tool invocation triggers fresh OAuth flow

---

## 3. API / Behaviors

### 3.1 logout

**Purpose:** Clear stored OAuth tokens to enable re-authentication with a different account.

**MCP Tool Definition:**

```typescript
{
  name: 'logout',
  description: 'Clear stored Google OAuth credentials. Use this to switch to a different Google account. The next tool call will trigger a new authentication flow.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
}
```

**Behavior:**

1. Call `deleteTokens()` from `src/auth/token-store.ts`
2. Return success message indicating credentials were cleared

**Response:**

```typescript
{
  content: [
    {
      type: 'text',
      text: 'Logged out successfully. Your stored credentials have been cleared. The next tool call will prompt you to authenticate with Google.'
    }
  ]
}
```

**Errors:**

| Condition | Response |
|-----------|----------|
| Token file doesn't exist | Success (no-op, already logged out) |
| File deletion fails | Error with details |

---

## 4. Implementation Phases

| Phase | Description | Dependencies | Complexity |
|-------|-------------|--------------|------------|
| 1 | Create `logout` tool in `src/tools/auth/logout.ts` | None | Low |
| 2 | Register tool in `src/tools/index.ts` | Phase 1 | Low |

---

## 5. Future Considerations

Potential additions to this spec (not currently planned):

- **auth_status** - Tool to check if authenticated and show current account
- **Token revocation** - Call Google's revoke endpoint before clearing local tokens
- **Force re-auth** - Trigger OAuth flow even with valid tokens

---

## 6. References

- [Token Store Implementation](../src/auth/token-store.ts) - Existing `deleteTokens()` function
- [OAuth Authentication Spec](./oauth-authentication.md) - Related authentication spec
