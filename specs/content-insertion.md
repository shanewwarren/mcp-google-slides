# Content Insertion Specification

**Status:** Implemented
**Version:** 1.0
**Last Updated:** 2026-01-18

---

## 1. Overview

### Purpose

Provides MCP tools for adding various content types to slides: text, images, shapes, tables, and speaker notes. This is the primary interface for LLMs to populate slides with meaningful content.

### Goals

- **Insert text** - Add text to placeholders or arbitrary positions
- **Add images** - Insert images from URLs
- **Create shapes** - Add basic shapes (rectangles, circles, arrows)
- **Insert tables** - Create and populate data tables
- **Add speaker notes** - Attach notes to slides for the presenter

### Non-Goals

- **Video embedding** - Complex, deferred to future version
- **Chart creation** - Requires Sheets integration, out of scope
- **Animation effects** - Not supported by the API for creation
- **Audio embedding** - Not supported

---

## 2. Architecture

### Component Structure

```
src/
├── tools/
│   └── content/
│       ├── insert-text.ts      # insert_text tool
│       ├── insert-image.ts     # insert_image tool
│       ├── create-shape.ts     # create_shape tool
│       ├── create-table.ts     # create_table tool
│       ├── set-speaker-notes.ts # set_speaker_notes tool
│       └── index.ts
└── utils/
    └── positioning.ts          # EMU conversion utilities
```

### Unit System

Google Slides uses **EMU (English Metric Units)** for positioning:
- 1 inch = 914400 EMU
- 1 point = 12700 EMU
- 1 cm = 360000 EMU

The tools accept human-readable units (inches, points) and convert internally.

---

## 3. Core Types

### 3.1 Position

Position and size for page elements.

```typescript
interface Position {
  x: number;           // Left edge in inches
  y: number;           // Top edge in inches
  width: number;       // Width in inches
  height: number;      // Height in inches
}
```

### 3.2 ShapeType

Available shape types. The Google Slides API supports many shape types; here are the most commonly used:

```typescript
type ShapeType =
  // Basic shapes
  | 'RECTANGLE'
  | 'ROUND_RECTANGLE'
  | 'ELLIPSE'
  | 'TRIANGLE'
  | 'PARALLELOGRAM'
  | 'TRAPEZOID'
  | 'PENTAGON'
  | 'HEXAGON'
  | 'DIAMOND'
  // Arrows
  | 'RIGHT_ARROW'
  | 'LEFT_ARROW'
  | 'UP_ARROW'
  | 'DOWN_ARROW'
  | 'LEFT_RIGHT_ARROW'
  | 'UP_DOWN_ARROW'
  | 'BENT_ARROW'
  | 'CURVED_RIGHT_ARROW'
  // Stars and banners
  | 'STAR_4'
  | 'STAR_5'
  | 'STAR_6'
  | 'STAR_8'
  | 'RIBBON'
  | 'RIBBON_2'
  // Callouts
  | 'CALLOUT_RECTANGLE'
  | 'CALLOUT_ROUND_RECTANGLE'
  | 'CALLOUT_ELLIPSE'
  // Special
  | 'TEXT_BOX'            // For creating text boxes
  | 'CLOUD'
  | 'HEART'
  | 'PLUS'
  | 'WAVE';
```

**Note:** Use `TEXT_BOX` as the shapeType when creating text boxes for arbitrary text placement.

### 3.3 TableData

Table structure for creation.

```typescript
interface TableData {
  rows: number;
  columns: number;
  cells?: string[][];   // Optional initial content (row-major)
}
```

---

## 4. MCP Tools

### 4.1 insert_text

**Purpose:** Inserts text into a placeholder or creates a new text box.

**Tool Definition:**

```typescript
{
  name: "insert_text",
  description: "Insert text into a slide placeholder or create a text box",
  inputSchema: {
    type: "object",
    properties: {
      presentationId: {
        type: "string",
        description: "The presentation ID"
      },
      slideId: {
        type: "string",
        description: "The slide to add text to"
      },
      text: {
        type: "string",
        description: "The text content to insert"
      },
      placeholderId: {
        type: "string",
        description: "ID of an existing placeholder to fill. If omitted, creates a text box."
      },
      position: {
        type: "object",
        description: "Position for new text box (ignored if placeholderId provided)",
        properties: {
          x: { type: "number", description: "Left edge in inches" },
          y: { type: "number", description: "Top edge in inches" },
          width: { type: "number", description: "Width in inches" },
          height: { type: "number", description: "Height in inches" }
        }
      }
    },
    required: ["presentationId", "slideId", "text"]
  }
}
```

**Example - Fill placeholder:**

```json
{
  "presentationId": "1BxiMVs...",
  "slideId": "g123abc",
  "text": "Welcome to Our Company",
  "placeholderId": "g123abc_title"
}
```

**Example - Create text box:**

```json
{
  "presentationId": "1BxiMVs...",
  "slideId": "g123abc",
  "text": "Footer text",
  "position": { "x": 0.5, "y": 7, "width": 9, "height": 0.5 }
}
```

### 4.2 insert_image

**Purpose:** Inserts an image from a URL onto a slide.

**Tool Definition:**

```typescript
{
  name: "insert_image",
  description: "Insert an image onto a slide from a URL",
  inputSchema: {
    type: "object",
    properties: {
      presentationId: {
        type: "string",
        description: "The presentation ID"
      },
      slideId: {
        type: "string",
        description: "The slide to add the image to"
      },
      imageUrl: {
        type: "string",
        description: "URL of the image to insert (must be publicly accessible)"
      },
      position: {
        type: "object",
        description: "Position and size for the image",
        properties: {
          x: { type: "number", description: "Left edge in inches" },
          y: { type: "number", description: "Top edge in inches" },
          width: { type: "number", description: "Width in inches" },
          height: { type: "number", description: "Height in inches" }
        },
        required: ["x", "y", "width", "height"]
      },
      altText: {
        type: "string",
        description: "Alt text for accessibility"
      }
    },
    required: ["presentationId", "slideId", "imageUrl", "position"]
  }
}
```

**Response:**

```typescript
{
  imageId: string;
  actualSize: {
    width: number;
    height: number;
  };
}
```

**Notes:**
- Image URL must be publicly accessible (no authentication)
- Large images are automatically scaled to fit the specified dimensions
- Aspect ratio is preserved by default

### 4.3 create_shape

**Purpose:** Creates a shape on a slide.

**Tool Definition:**

```typescript
{
  name: "create_shape",
  description: "Create a shape on a slide",
  inputSchema: {
    type: "object",
    properties: {
      presentationId: {
        type: "string",
        description: "The presentation ID"
      },
      slideId: {
        type: "string",
        description: "The slide to add the shape to"
      },
      shapeType: {
        type: "string",
        enum: [
          "RECTANGLE", "ROUND_RECTANGLE", "ELLIPSE", "TRIANGLE",
          "RIGHT_ARROW", "LEFT_ARROW", "UP_ARROW", "DOWN_ARROW",
          "STAR_5", "CALLOUT_RECTANGLE"
        ],
        description: "The type of shape to create"
      },
      position: {
        type: "object",
        properties: {
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number" },
          height: { type: "number" }
        },
        required: ["x", "y", "width", "height"]
      },
      fillColor: {
        type: "string",
        description: "Fill color as hex (e.g., '#FF5733') or color name"
      },
      text: {
        type: "string",
        description: "Optional text to place inside the shape"
      }
    },
    required: ["presentationId", "slideId", "shapeType", "position"]
  }
}
```

### 4.4 create_table

**Purpose:** Creates a table on a slide.

**Tool Definition:**

```typescript
{
  name: "create_table",
  description: "Create a table on a slide",
  inputSchema: {
    type: "object",
    properties: {
      presentationId: {
        type: "string",
        description: "The presentation ID"
      },
      slideId: {
        type: "string",
        description: "The slide to add the table to"
      },
      rows: {
        type: "number",
        description: "Number of rows"
      },
      columns: {
        type: "number",
        description: "Number of columns"
      },
      position: {
        type: "object",
        properties: {
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number" },
          height: { type: "number" }
        },
        required: ["x", "y", "width", "height"]
      },
      data: {
        type: "array",
        description: "Table data as 2D array of strings (row-major order)",
        items: {
          type: "array",
          items: { type: "string" }
        }
      }
    },
    required: ["presentationId", "slideId", "rows", "columns", "position"]
  }
}
```

**Example:**

```json
{
  "presentationId": "1BxiMVs...",
  "slideId": "g123abc",
  "rows": 3,
  "columns": 2,
  "position": { "x": 1, "y": 2, "width": 8, "height": 3 },
  "data": [
    ["Product", "Sales"],
    ["Widget A", "$50,000"],
    ["Widget B", "$75,000"]
  ]
}
```

### 4.5 set_speaker_notes

**Purpose:** Adds or updates speaker notes for a slide.

**Tool Definition:**

```typescript
{
  name: "set_speaker_notes",
  description: "Add or update speaker notes for a slide",
  inputSchema: {
    type: "object",
    properties: {
      presentationId: {
        type: "string",
        description: "The presentation ID"
      },
      slideId: {
        type: "string",
        description: "The slide to add notes to"
      },
      notes: {
        type: "string",
        description: "The speaker notes content (plain text or simple formatting)"
      }
    },
    required: ["presentationId", "slideId", "notes"]
  }
}
```

**Notes:**
- Speaker notes appear in presenter view
- Supports basic text; rich formatting can be applied with UpdateTextStyleRequest
- To replace existing notes, delete existing text first with DeleteTextRequest

---

## 5. API Mapping

### batchUpdate Requests Used

| MCP Tool | Google API Request(s) |
|----------|----------------------|
| insert_text (placeholder) | InsertTextRequest |
| insert_text (text box) | CreateShapeRequest (shapeType: TEXT_BOX) + InsertTextRequest |
| insert_image | CreateImageRequest |
| create_shape | CreateShapeRequest |
| create_table | CreateTableRequest + InsertTextRequest (for each cell) |
| set_speaker_notes | InsertTextRequest (to speaker notes shape) |

### Speaker Notes Implementation

Each slide has an associated notes page with a speaker notes shape. To modify speaker notes:

1. **Find the notes shape ID**: Get the slide and access `slideProperties.notesPage.notesProperties.speakerNotesObjectId`
2. **Insert text**: Use InsertTextRequest targeting the speaker notes object ID
3. **Clear existing notes**: Use DeleteTextRequest with textRange type `ALL` before inserting

```typescript
// Finding speaker notes shape ID
const slide = presentation.slides[index];
const notesShapeId = slide.slideProperties.notesPage.notesProperties.speakerNotesObjectId;
```

### CreateImageRequest Structure

```typescript
{
  createImage: {
    objectId?: string,        // Optional custom ID for the image
    url: string,              // Must be publicly accessible HTTPS URL
    elementProperties: {
      pageObjectId: string,   // Slide ID where image will be placed
      size: {
        width: { magnitude: number, unit: 'EMU' },
        height: { magnitude: number, unit: 'EMU' }
      },
      transform: {
        scaleX: 1,
        scaleY: 1,
        translateX: number,   // EMU - horizontal position
        translateY: number,   // EMU - vertical position
        unit: 'EMU'
      }
    }
  }
}
```

**Image URL Requirements:**
- Must be publicly accessible (no authentication required)
- HTTPS recommended
- Google fetches and caches the image; original URL is not stored
- Supported formats: PNG, JPEG, GIF, BMP, WEBP

---

## 6. Positioning Utilities

### Standard Slide Dimensions

Default Google Slides page size:
- Width: 10 inches (9144000 EMU)
- Height: 7.5 inches (6858000 EMU)

### Common Positions

| Name | Position | Use Case |
|------|----------|----------|
| Centered | x: 1, y: 1.5, w: 8, h: 5 | Main content |
| Title area | x: 0.5, y: 0.3, w: 9, h: 1 | Slide title |
| Full bleed | x: 0, y: 0, w: 10, h: 7.5 | Background image |
| Footer | x: 0.5, y: 7, w: 9, h: 0.4 | Footer text |

---

## 7. Error Handling

| Error Code | Condition | User Message |
|------------|-----------|--------------|
| IMAGE_FETCH_FAILED | Cannot fetch image URL | "Unable to fetch image from URL" |
| INVALID_POSITION | Position outside slide bounds | "Position is outside slide boundaries" |
| PLACEHOLDER_NOT_FOUND | Invalid placeholder ID | "Placeholder not found on slide" |
| TABLE_TOO_LARGE | Table exceeds limits | "Table dimensions exceed maximum (25 rows, 20 columns)" |

---

## 8. Implementation Phases

| Phase | Description | Dependencies | Complexity |
|-------|-------------|--------------|------------|
| 1 | insert_text with placeholders | Slide operations | Low |
| 2 | insert_text with text boxes | Phase 1 | Medium |
| 3 | insert_image | Phase 1 | Medium |
| 4 | create_shape | Phase 1 | Medium |
| 5 | create_table | Phase 1 | High |
| 6 | set_speaker_notes | Phase 1 | Low |

---

## 9. Open Questions

- [x] Should we support replacing placeholder content vs. appending? → **Support both: use DeleteTextRequest to clear before InsertTextRequest for replace behavior**
- [x] Should image URLs be validated before sending to the API? → **No, let the API handle validation. It provides clear error messages for invalid URLs.**

---

## 10. Additional Request Types

These batchUpdate request types may be useful for advanced content operations:

| Request | Purpose |
|---------|---------|
| DeleteTextRequest | Remove text from a range |
| ReplaceAllTextRequest | Find and replace text across presentation |
| UpdatePageElementTransformRequest | Move, resize, or rotate elements |
| UpdateShapePropertiesRequest | Change shape fill, outline, shadow |
| UpdateImagePropertiesRequest | Adjust image properties like contrast |
| InsertTableRowsRequest | Add rows to existing table |
| InsertTableColumnsRequest | Add columns to existing table |
| DeleteTableRowRequest | Remove table rows |
| DeleteTableColumnRequest | Remove table columns |
| MergeTableCellsRequest | Combine adjacent cells |
