# Bun Migration Specification

**Status:** Implemented
**Version:** 1.0
**Last Updated:** 2026-01-18

---

## 1. Overview

### Purpose

Migrate the project from the Node.js/npm toolchain to Bun for faster development cycles, simpler tooling, and native TypeScript support. This includes replacing the runtime, test framework, linting/formatting tools, and HTTP server implementation.

### Goals

- **Faster execution** - Bun's native performance for running, testing, and building
- **Simplified toolchain** - Single tool for runtime, package management, testing, and bundling
- **Native TypeScript** - No transpilation step required for development
- **Modern tooling** - Biome for unified, fast linting and formatting

### Non-Goals

- **Node.js compatibility shim** - Not maintaining backwards compatibility with npm/node
- **Gradual migration** - Full cutover, not a hybrid approach
- **Bundle optimization** - Focus on development tooling, not production bundling (yet)

---

## 2. Architecture

### Toolchain Changes

| Concern | Current | Target |
|---------|---------|--------|
| Runtime | Node.js + tsx | Bun |
| Package Manager | npm | bun |
| Test Runner | Jest + ts-jest | bun test |
| Type Checking | tsc --noEmit | biome check |
| Linting | (none) | biome lint |
| Formatting | (none) | biome format |
| HTTP Server | Node.js http module | Bun.serve() |

### File Changes

```
project/
├── package.json           # Update scripts
├── biome.json             # NEW: Biome configuration
├── bunfig.toml            # OPTIONAL: Bun configuration
├── jest.config.js         # DELETE
├── src/
│   └── auth/
│       └── callback-server.ts  # Refactor to Bun.serve()
└── tests/
    └── **/*.test.ts       # Minor updates for bun:test
```

---

## 3. Package.json Updates

### Scripts

```json
{
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target node",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "lint": "bunx --bun biome check .",
    "lint:fix": "bunx --bun biome check --write .",
    "format": "bunx --bun biome format --write .",
    "typecheck": "bunx --bun biome check --linter-enabled=false .",
    "clean": "rm -rf dist"
  }
}
```

### Dependencies to Remove

```json
{
  "devDependencies": {
    "@types/jest": "REMOVE",
    "jest": "REMOVE",
    "ts-jest": "REMOVE",
    "tsx": "REMOVE"
  }
}
```

### Dependencies to Add

```json
{
  "devDependencies": {
    "@biomejs/biome": "^2.0.0",
    "@types/bun": "latest"
  }
}
```

---

## 4. Biome Configuration

### biome.json

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": ["node_modules", "dist", "coverage"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      },
      "style": {
        "noVar": "error",
        "useConst": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5"
    }
  }
}
```

---

## 5. Test Migration

### Compatibility

Bun's test runner is largely Jest-compatible. Most tests will work without changes.

**Automatic Rewrites:**
- `import { test, expect } from '@jest/globals'` → `bun:test`
- Global `describe`, `test`, `expect` injected automatically

### TypeScript Support

Add to project root or `tests/` directory:

**global.d.ts:**
```typescript
/// <reference types="bun-types" />
/// <reference types="bun-types/test-globals" />
```

### Minor Differences

| Jest | Bun | Notes |
|------|-----|-------|
| `jest.fn()` | `mock()` | Import from `bun:test` |
| `jest.spyOn()` | `spyOn()` | Import from `bun:test` |
| `jest.mock()` | `mock.module()` | Different API |
| `toBeCloseTo(n, d)` | Same | Works identically |

### Test File Updates

Most test files require no changes. For mocking:

```typescript
// Before (Jest)
import { jest } from '@jest/globals';
const mockFn = jest.fn();

// After (Bun)
import { mock } from 'bun:test';
const mockFn = mock();
```

---

## 6. OAuth Callback Server Migration

### Current Implementation (Node.js http)

```typescript
import * as http from 'http';

const server = http.createServer((req, res) => {
  // Handle request
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
});

server.listen(port, '127.0.0.1', () => {});
```

### Target Implementation (Bun.serve)

```typescript
const server = Bun.serve({
  port,
  hostname: '127.0.0.1',

  fetch(req) {
    const url = new URL(req.url);

    if (req.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    if (!url.pathname.startsWith('/callback')) {
      return new Response('Not Found', { status: 404 });
    }

    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    // Handle OAuth callback...

    return new Response(successHtml, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
});

// Cleanup
server.stop();
```

### Key Differences

| Node.js http | Bun.serve | Notes |
|--------------|-----------|-------|
| `http.createServer()` | `Bun.serve()` | Returns server object |
| `server.listen()` | Immediate start | Server starts on creation |
| `server.close()` | `server.stop()` | Method name change |
| `res.writeHead()` | `new Response()` | Standard Response API |
| Callback-based | Promise/fetch-based | Modern async pattern |

### Timeout Handling

```typescript
// Use AbortController for timeout
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);

// In fetch handler, check controller.signal.aborted
```

---

## 7. Implementation Phases

| Phase | Description | Dependencies | Files Changed |
|-------|-------------|--------------|---------------|
| 1 | Install Bun and Biome | None | package.json |
| 2 | Update package.json scripts | Phase 1 | package.json |
| 3 | Create biome.json configuration | Phase 1 | biome.json |
| 4 | Add Bun type declarations | Phase 1 | global.d.ts |
| 5 | Migrate callback-server.ts to Bun.serve | Phase 1 | src/auth/callback-server.ts |
| 6 | Update test mocks for Bun compatibility | Phase 4 | tests/**/*.test.ts |
| 7 | Remove Jest/tsx dependencies | Phase 6 | package.json, jest.config.js |
| 8 | Run full test suite and fix issues | Phase 7 | Various |
| 9 | Update CLAUDE.md and documentation | Phase 8 | CLAUDE.md |

---

## 8. Validation Checklist

After migration, verify:

- [ ] `bun run dev` starts the MCP server
- [ ] `bun test` passes all tests
- [ ] `bun run lint` reports no errors
- [ ] `bun run format` formats code correctly
- [ ] OAuth flow works with Bun.serve() callback server
- [ ] No Node.js-specific APIs remain (except googleapis client)

---

## 9. Rollback Plan

If migration fails:

1. Revert package.json changes
2. Restore jest.config.js from git
3. Run `npm install` to restore node_modules
4. Verify `npm test` passes

Git provides full rollback capability since all changes are tracked.

---

## 10. Open Questions

- [x] Does googleapis library work with Bun? → Yes, Bun has high Node.js compatibility
- [ ] Should we use Bun's bundler for production builds?
- [ ] Should we add a bunfig.toml for additional configuration?
