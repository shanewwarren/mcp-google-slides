# Presentation Management Specification

**Status:** Implemented
**Version:** 1.0
**Last Updated:** 2026-01-18

---

## 1. Overview

### Purpose

Provides MCP tools for creating, retrieving, and listing Google Slides presentations. This is the foundation layer that other features (slides, content) build upon.

### Goals

- **Create presentations** - Create new blank presentations with a title
- **Retrieve presentations** - Get full presentation data including all slides
- **List presentations** - Find presentations created by this MCP server
- **Open presentations** - Get shareable/editable links

### Non-Goals

- **Delete presentations** - Destructive operations deferred to avoid accidents
- **Share/permission management** - Complex sharing logic out of scope
- **Template-based creation** - May add later, not in v1

---

## 2. Architecture

### Component Structure

```
src/
├── tools/
│   ├── presentations/
│   │   ├── create.ts         # create_presentation tool
│   │   ├── get.ts            # get_presentation tool
│   │   ├── list.ts           # list_presentations tool
│   │   └── index.ts          # Tool registration
│   └── index.ts              # All tools export
└── clients/
    └── slides-client.ts      # Google Slides API wrapper
```

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  MCP Tool   │────▶│ SlidesClient│────▶│ Google API  │
│  Handler    │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ OAuth Client│
                    └─────────────┘
```

---

## 3. Core Types

### 3.1 PresentationSummary

Lightweight representation of a presentation for listings.

```typescript
interface PresentationSummary {
  presentationId: string;
  title: string;
  createdTime: string;       // ISO 8601
  modifiedTime: string;      // ISO 8601
  slideCount: number;
  link: string;              // Direct edit URL
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| presentationId | string | Yes | Unique Google Slides ID |
| title | string | Yes | Presentation title |
| createdTime | string | Yes | Creation timestamp (ISO 8601) |
| modifiedTime | string | Yes | Last modified timestamp |
| slideCount | number | Yes | Number of slides |
| link | string | Yes | URL to open in Google Slides |

### 3.2 Presentation

Full presentation data from the API.

```typescript
interface Presentation {
  presentationId: string;
  title: string;
  slides: Slide[];
  masters: Master[];
  layouts: Layout[];
  locale: string;
  pageSize: Size;
}
```

### 3.3 CreatePresentationInput

Input for creating a new presentation.

```typescript
interface CreatePresentationInput {
  title: string;
}
```

---

## 4. MCP Tools

### 4.1 create_presentation

**Purpose:** Creates a new blank Google Slides presentation.

**Tool Definition:**

```typescript
{
  name: "create_presentation",
  description: "Create a new Google Slides presentation",
  inputSchema: {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: "Title for the new presentation"
      }
    },
    required: ["title"]
  }
}
```

**Response:**

```typescript
{
  presentationId: string;
  title: string;
  link: string;
}
```

**Example:**

```json
// Input
{ "title": "Q1 2025 Sales Review" }

// Output
{
  "presentationId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
  "title": "Q1 2025 Sales Review",
  "link": "https://docs.google.com/presentation/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
}
```

### 4.2 get_presentation

**Purpose:** Retrieves full details of a presentation including all slides.

**Tool Definition:**

```typescript
{
  name: "get_presentation",
  description: "Get details of a Google Slides presentation",
  inputSchema: {
    type: "object",
    properties: {
      presentationId: {
        type: "string",
        description: "The ID of the presentation to retrieve"
      }
    },
    required: ["presentationId"]
  }
}
```

**Response:**

```typescript
{
  presentationId: string;
  title: string;
  slideCount: number;
  slides: Array<{
    objectId: string;
    pageType: string;
    elements: number;      // Count of page elements
  }>;
  link: string;
}
```

### 4.3 list_presentations

**Purpose:** Lists presentations accessible to the authenticated user (created by this app).

**Tool Definition:**

```typescript
{
  name: "list_presentations",
  description: "List Google Slides presentations created by this app",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of presentations to return",
        default: 10
      }
    }
  }
}
```

**Response:**

```typescript
{
  presentations: PresentationSummary[];
  totalCount: number;
}
```

**Note:** Uses Drive API with `drive.file` scope to list only files created by this application.

---

## 5. API Mapping

### Google Slides API Methods Used

| MCP Tool | Google API Method | Endpoint |
|----------|-------------------|----------|
| create_presentation | presentations.create | POST /v1/presentations |
| get_presentation | presentations.get | GET /v1/presentations/{presentationId} |
| list_presentations | drive.files.list | GET /drive/v3/files (filtered) |

### Create Presentation Request

```typescript
// POST https://slides.googleapis.com/v1/presentations
{
  title: string  // Optional, defaults to "Untitled presentation"
}
```

### Get Presentation Response Structure

The `presentations.get` response includes:
- `presentationId` - Unique identifier
- `title` - Presentation title
- `locale` - Locale setting (e.g., "en")
- `pageSize` - Dimensions in EMU
- `slides` - Array of slide pages
- `masters` - Array of master pages
- `layouts` - Array of layout pages

### Drive API Query for Listing

```
mimeType='application/vnd.google-apps.presentation'
```

**Note:** With `drive.file` scope, only presentations created by this application are returned.

---

## 6. Error Handling

| Error Code | Condition | User Message |
|------------|-----------|--------------|
| NOT_AUTHENTICATED | No valid OAuth token | "Please authenticate with Google first" |
| PRESENTATION_NOT_FOUND | Invalid presentation ID | "Presentation not found or not accessible" |
| PERMISSION_DENIED | No access to presentation | "You don't have permission to access this presentation" |
| QUOTA_EXCEEDED | API rate limit hit | "Google API quota exceeded, please try again later" |

---

## 7. Implementation Phases

| Phase | Description | Dependencies | Complexity |
|-------|-------------|--------------|------------|
| 1 | SlidesClient wrapper | OAuth module | Low |
| 2 | create_presentation tool | Phase 1 | Low |
| 3 | get_presentation tool | Phase 1 | Low |
| 4 | list_presentations tool | Phase 1 + Drive API | Medium |

---

## 8. Open Questions

- [x] Should list_presentations show all user presentations or just ones created by this app? → **Only ones created by this app (drive.file scope limitation)**
