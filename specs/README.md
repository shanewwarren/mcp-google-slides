# MCP Google Slides Specifications

Design documentation for an MCP server that enables LLMs to create and manage Google Slides presentations via OAuth authentication.

## Overview

This directory contains specifications for the project's features and systems. Each spec describes the design intent, architecture, and implementation guidance for a specific concern.

**Spec Revision:** 1.1 (January 2026) - Updated with accurate Google Slides API details

**Status Legend:**
- **Planned** - Design complete, not yet implemented
- **In Progress** - Currently being implemented
- **Implemented** - Feature complete and in production

---

## Authentication

| Spec | Status | Purpose |
|------|--------|---------|
| [oauth-authentication.md](./oauth-authentication.md) | Implemented | Browser-based Google OAuth 2.1 with PKCE and token management |

## Presentation Operations

| Spec | Status | Purpose |
|------|--------|---------|
| [presentation-management.md](./presentation-management.md) | Implemented | Creating, retrieving, and listing presentations |
| [slide-operations.md](./slide-operations.md) | Implemented | Adding and managing slides with predefined layouts |

## Content Creation

| Spec | Status | Purpose |
|------|--------|---------|
| [content-insertion.md](./content-insertion.md) | Implemented | Adding text, images, shapes, tables, and speaker notes |
| [text-formatting.md](./text-formatting.md) | Implemented | Styling text with fonts, colors, bullets, and paragraph formatting |

## Infrastructure

| Spec | Status | Purpose |
|------|--------|---------|
| [bun-migration.md](./bun-migration.md) | Implemented | Migrate from Node.js/npm/Jest to Bun runtime and tooling |

---

## Using These Specs

### For Implementers

1. **Read the spec first** before writing code
2. **Check existing code** - specs describe intent, code describes reality
3. **Follow the patterns** outlined in each spec's Architecture section
4. **Update status** when implementation begins/completes

### For Reviewers

1. **Compare against spec** during code review
2. **Flag deviations** that aren't documented
3. **Propose spec updates** when implementation reveals better approaches

### Updating Specs

Specs are living documents. Update them when:
- Implementation reveals a better approach
- Requirements change
- New edge cases are discovered

---

## API Reference

These specifications were developed using the official Google Slides API documentation:

- [Google Slides API Overview](https://developers.google.com/workspace/slides/api/guides/overview)
- [batchUpdate Reference](https://developers.google.com/workspace/slides/api/reference/rest/v1/presentations/batchUpdate)
- [Request Types](https://developers.google.com/workspace/slides/api/reference/rest/v1/presentations/request)
- [OAuth 2.0 for Desktop Apps](https://developers.google.com/identity/protocols/oauth2/native-app)

---

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project-level AI guidance
