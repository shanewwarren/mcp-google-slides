# MCP Google Slides

An MCP (Model Context Protocol) server that enables AI assistants like Claude to create and manage Google Slides presentations with zero-config OAuth authentication.

## Features

- **Presentation Management**: Create, retrieve, and list Google Slides presentations
- **Slide Operations**: Add, delete, and reorder slides with predefined layouts
- **Content Insertion**: Add text, images, shapes, tables, and speaker notes
- **Text Formatting**: Style text with fonts, colors, bold, italic, bullets, and more
- **Zero-Config Auth**: Browser-based OAuth 2.1 with PKCE - no API keys required

## Prerequisites

- [Bun](https://bun.sh) runtime
- A Google account with access to Google Slides

## Installation

### Add to Claude Code

For full MCP documentation, see [Claude Code MCP docs](https://docs.anthropic.com/en/docs/claude-code/mcp).

First, clone and install the server:

```bash
git clone https://github.com/shanewwarren/mcp-google-slides.git
cd mcp-google-slides
bun install
```

Then add to Claude Code:

```bash
claude mcp add google-slides /path/to/mcp-google-slides/bin/mcp-google-slides
```

Or add directly to your `.mcp.json` configuration file:

```json
{
  "mcpServers": {
    "google-slides": {
      "type": "stdio",
      "command": "/path/to/mcp-google-slides/bin/mcp-google-slides"
    }
  }
}
```

## Authentication

This server uses **browser-based OAuth 2.1 with PKCE** for authentication. No API keys or manual setup required.

### How It Works

1. **First Tool Use**: When you first invoke any tool (e.g., `create_presentation`), the server automatically opens your browser to Google's consent screen
2. **Grant Permission**: Sign in with your Google account and authorize the application
3. **Automatic Token Storage**: Tokens are securely stored locally at `~/.mcp-google-slides/tokens.json`
4. **Automatic Refresh**: Access tokens are automatically refreshed before expiration

### Re-authentication

If you need to re-authenticate (e.g., to switch accounts), delete the token file:

```bash
rm ~/.mcp-google-slides/tokens.json
```

The next tool invocation will trigger a new authentication flow.

### OAuth Scopes

The server requests the following permissions:

| Scope | Purpose |
|-------|---------|
| `presentations` | Create and edit Google Slides presentations |
| `drive.file` | Access files created by this application only |

**Note**: The `drive.file` scope is limited - it only allows access to presentations created by this MCP server, not your entire Google Drive.

## Configuration

| Environment Variable | Required | Default | Description |
|---------------------|----------|---------|-------------|
| `MCP_GSLIDES_TOKEN_PATH` | No | `~/.mcp-google-slides/tokens.json` | Path to token storage file |
| `MCP_GSLIDES_CALLBACK_PORT` | No | `8085` | Port for OAuth callback server |

## Available Tools

### Presentation Management

| Tool | Description |
|------|-------------|
| `create_presentation` | Create a new Google Slides presentation |
| `get_presentation` | Get details about a presentation including all slides |
| `list_presentations` | List presentations created by this app |

### Slide Operations

| Tool | Description |
|------|-------------|
| `add_slide` | Add a new slide with a specified layout |
| `delete_slide` | Remove a slide from the presentation |
| `get_slide` | Get details about a specific slide |
| `reorder_slides` | Change the order of slides |

### Content Insertion

| Tool | Description |
|------|-------------|
| `insert_text` | Add text to a placeholder or create a text box |
| `insert_image` | Insert an image from a URL |
| `create_shape` | Add shapes (rectangle, arrow, ellipse, etc.) |
| `create_table` | Create and populate a data table |
| `set_speaker_notes` | Add presenter notes to a slide |

### Text Formatting

| Tool | Description |
|------|-------------|
| `format_text` | Style text (font, size, color, bold, italic, underline) |
| `format_paragraph` | Set paragraph alignment, spacing, and indentation |
| `create_bullets` | Convert text to bulleted or numbered lists |
| `remove_bullets` | Remove bullet formatting from text |

## Predefined Layouts

When adding slides, you can specify these layouts:

| Layout | Best For |
|--------|----------|
| `BLANK` | Custom content, images, diagrams |
| `TITLE` | Opening/closing slides |
| `TITLE_AND_BODY` | Standard content slides |
| `TITLE_AND_TWO_COLUMNS` | Comparisons, side-by-side content |
| `TITLE_ONLY` | Headers, transitions |
| `SECTION_HEADER` | Chapter breaks |
| `ONE_COLUMN_TEXT` | Long-form text |
| `MAIN_POINT` | Key takeaways |
| `BIG_NUMBER` | Statistics, metrics |
| `CAPTION_ONLY` | Image with caption |

## Example Usage

Here's a typical workflow for creating a presentation:

```
1. create_presentation → "Q1 Sales Review"
2. add_slide → layout: TITLE_AND_BODY
3. insert_text → title placeholder: "Revenue Overview"
4. insert_text → body placeholder: "Point 1\nPoint 2\nPoint 3"
5. create_bullets → convert body to bullet list
6. format_text → style title: bold, 44pt, blue
7. set_speaker_notes → "Discuss Q1 highlights..."
```

## Development

```bash
# Install dependencies
bun install

# Run in development mode (with hot reload)
bun run dev

# Run tests
bun test

# Lint and format
bun run lint:fix

# Type check
bun run typecheck
```

## Troubleshooting

### "Authentication failed" or browser doesn't open

- Ensure port 8085 (or your configured port) is not in use
- Check that your firewall allows localhost connections
- Try deleting `~/.mcp-google-slides/tokens.json` and re-authenticating

### "Permission denied" errors

- The `drive.file` scope only allows access to files created by this app
- You cannot access presentations created outside of this MCP server
- Use `list_presentations` to see available presentations

### Token refresh issues

- Delete `~/.mcp-google-slides/tokens.json` to force re-authentication
- Ensure your Google account still has access to Google Slides

## License

MIT
