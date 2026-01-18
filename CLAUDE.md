# MCP Google Slides

An MCP (Model Context Protocol) server that enables LLMs to create and manage Google Slides presentations with zero-config OAuth authentication.

## Project Overview

This server allows users to ask an LLM to generate Google Slides presentations from their content. Unlike existing solutions that require manual API key setup, this server uses browser-based OAuth 2.1 (like the Atlassian MCP server) for frictionless authentication.

## Key Design Decisions

- **TypeScript + MCP SDK** - Uses `@modelcontextprotocol/sdk` for the server implementation
- **Bun Runtime** - Uses Bun for runtime, package management, and testing (see `specs/bun-migration.md`)
- **Biome Tooling** - Uses Biome for linting and formatting
- **Browser OAuth with PKCE** - No manual API key creation; opens browser for Google consent
- **Token persistence** - Credentials stored locally at `~/.mcp-google-slides/tokens.json`
- **Bundled OAuth credentials** - Server includes its own Google Cloud OAuth client (not user-provided)

## Specifications

**IMPORTANT:** Before implementing any feature, consult `specs/README.md`.

- **Assume NOT implemented.** Specs describe intent; code describes reality.
- **Check the codebase first.** Search actual code before concluding.
- **Use specs as guidance.** Follow design patterns in relevant spec.
- **Spec index:** `specs/README.md` lists all specs by category.

## Architecture

```
src/
├── auth/           # OAuth 2.1 with PKCE, token storage
├── clients/        # Google Slides API wrapper
├── tools/          # MCP tool implementations
│   ├── presentations/
│   ├── slides/
│   ├── content/
│   └── formatting/
├── utils/          # EMU conversion, color parsing
└── index.ts        # MCP server entry point
```

## MCP Tools Summary

| Tool | Purpose |
|------|---------|
| `create_presentation` | Create new presentation |
| `get_presentation` | Get presentation details |
| `list_presentations` | List presentations created by this app |
| `add_slide` | Add slide with layout |
| `delete_slide` | Remove a slide |
| `get_slide` | Get slide details |
| `insert_text` | Add text to placeholder or create text box |
| `insert_image` | Add image from URL |
| `create_shape` | Add shapes (rectangle, arrow, etc.) |
| `create_table` | Add data table |
| `set_speaker_notes` | Add presenter notes |
| `format_text` | Style text (font, color, bold, etc.) |
| `format_paragraph` | Paragraph alignment, spacing |
| `create_bullets` | Create bulleted/numbered lists |

## Google Slides API Notes

- **5 endpoints total** - create, get, batchUpdate (presentations), get, getThumbnail (pages)
- **batchUpdate does everything** - All modifications go through this single endpoint
- **EMU units** - 914400 EMU = 1 inch; tools accept inches and convert
- **Predefined layouts** - BLANK, TITLE, TITLE_AND_BODY, TITLE_AND_TWO_COLUMNS, etc.

## OAuth Scopes

- `https://www.googleapis.com/auth/presentations` - Create/edit presentations
- `https://www.googleapis.com/auth/drive.file` - Access files created by this app

## Dependencies

- `@modelcontextprotocol/sdk` - MCP server framework
- `googleapis` - Google Slides API client
- `google-auth-library` - OAuth 2.0 client
- `open` - Cross-platform browser launch
- `zod` - Input validation
- `@biomejs/biome` - Linting and formatting (dev)

## Development

```bash
# Install dependencies
bun install

# Run in development
bun run dev

# Build
bun run build

# Test
bun test

# Lint and format
bun run lint
bun run format
```

## References

- [Google Slides API Reference](https://developers.google.com/workspace/slides/api/reference/rest)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Atlassian MCP Server](https://github.com/atlassian/atlassian-mcp-server) (OAuth pattern reference)
