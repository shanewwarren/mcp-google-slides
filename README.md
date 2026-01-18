# MCP Google Slides

An MCP (Model Context Protocol) server that enables AI assistants like Claude to create and manage Google Slides presentations with zero-config OAuth authentication.

## Features

- **Presentation Management**: Create, retrieve, and list Google Slides presentations
- **Slide Operations**: Add, delete, and reorder slides with predefined layouts
- **Content Insertion**: Add text, images, shapes, tables, and speaker notes
- **Text Formatting**: Style text with fonts, colors, bold, italic, bullets, and more
- **Browser-Based Auth**: OAuth 2.1 with PKCE - just sign in with your Google account

## Prerequisites

- [Bun](https://bun.sh) runtime
- A Google account with access to Google Slides
- Google Cloud OAuth 2.0 credentials (see setup below)

## Installation

### 1. Create Google Cloud OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select an existing one)
3. Enable the **Google Slides API** and **Google Drive API**:
   - Go to **APIs & Services → Library**
   - Search for and enable both APIs
4. Configure the **OAuth consent screen**:
   - Go to **APIs & Services → OAuth consent screen**
   - Choose "External" user type
   - Fill in the required fields (app name, support email)
   - Add scopes: `presentations` and `drive.file`
   - Add your email as a test user (required while in testing mode)
5. Create **OAuth 2.0 credentials**:
   - Go to **APIs & Services → Credentials**
   - Click **Create Credentials → OAuth client ID**
   - Choose **Desktop app** as the application type
   - Save the **Client ID** and **Client Secret**

### 2. Clone and Install

```bash
git clone https://github.com/shanewwarren/mcp-google-slides.git
cd mcp-google-slides
bun install
```

### 3. Add to Claude Code

```bash
claude mcp add google-slides /path/to/mcp-google-slides/bin/mcp-google-slides \
  -e MCP_GSLIDES_CLIENT_ID=your-client-id.apps.googleusercontent.com \
  -e MCP_GSLIDES_CLIENT_SECRET=your-client-secret
```

Replace `/path/to/mcp-google-slides` with where you cloned the repo, and add your OAuth credentials.

Then run `/mcp` in Claude Code to connect to the server.

For full MCP documentation, see [Claude Code MCP docs](https://docs.anthropic.com/en/docs/claude-code/mcp).

## Authentication

This server uses **browser-based OAuth 2.1 with PKCE** for authentication.

### How It Works

1. **First Tool Use**: When you first invoke any tool (e.g., `create_presentation`), the server automatically opens your browser to Google's consent screen
2. **Grant Permission**: Sign in with your Google account and authorize the application
3. **Automatic Token Storage**: Tokens are securely stored locally at `~/.mcp-google-slides/tokens.json`
4. **Automatic Refresh**: Access tokens are automatically refreshed before expiration

### Multiple Users

The OAuth Client ID/Secret identify the *application*, not the user. Multiple people can use the same credentials to authenticate with their own Google accounts and access their own presentations.

**Note**: While your app is in "testing" mode, only users added as test users in Google Cloud Console can authenticate. To allow anyone, publish the app (users will see an "unverified app" warning) or go through Google's verification process.

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
| `MCP_GSLIDES_CLIENT_ID` | **Yes** | - | Google OAuth Client ID |
| `MCP_GSLIDES_CLIENT_SECRET` | **Yes** | - | Google OAuth Client Secret |
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

### "The OAuth client was not found" (Error 401: invalid_client)

- Ensure `MCP_GSLIDES_CLIENT_ID` and `MCP_GSLIDES_CLIENT_SECRET` are set correctly in your MCP config
- Verify your OAuth credentials are valid in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- After updating credentials, run `/mcp` in Claude Code to reconnect

### "Access blocked" or "This app isn't verified"

- Your Google Cloud app is in testing mode - add your email as a test user in the OAuth consent screen
- Or click "Advanced" → "Go to [app name] (unsafe)" to proceed anyway

### MCP server won't connect

- Make sure Bun is installed: `bun --version`
- Run the server directly to check for errors: `./bin/mcp-google-slides`
- Verify the path in `~/.claude.json` is correct

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
