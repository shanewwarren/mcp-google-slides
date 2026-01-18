# Slide Operations Specification

**Status:** Implemented
**Version:** 1.0
**Last Updated:** 2026-01-18

---

## 1. Overview

### Purpose

Provides MCP tools for adding, reordering, and managing slides within a presentation. Supports all Google Slides predefined layouts to enable structured content creation.

### Goals

- **Add slides** - Create new slides with predefined layouts
- **Delete slides** - Remove unwanted slides
- **Reorder slides** - Change slide positions
- **Get slide details** - Retrieve individual slide information

### Non-Goals

- **Custom layouts** - Only predefined layouts supported in v1
- **Master slide editing** - Not modifying slide masters
- **Slide duplication** - May add later

---

## 2. Architecture

### Component Structure

```
src/
├── tools/
│   └── slides/
│       ├── add-slide.ts      # add_slide tool
│       ├── delete-slide.ts   # delete_slide tool
│       ├── reorder-slides.ts # reorder_slides tool
│       ├── get-slide.ts      # get_slide tool
│       └── index.ts          # Tool registration
└── types/
    └── layouts.ts            # Layout type definitions
```

---

## 3. Core Types

### 3.1 PredefinedLayout

Available slide layouts from Google Slides. These are the official predefined layouts supported by the API.

```typescript
type PredefinedLayout =
  | 'PREDEFINED_LAYOUT_UNSPECIFIED'  // Unspecified layout (not recommended)
  | 'BLANK'                          // Empty slide, no placeholders
  | 'CAPTION_ONLY'                   // Caption at bottom
  | 'TITLE'                          // Title and subtitle centered
  | 'TITLE_AND_BODY'                 // Title with content area
  | 'TITLE_AND_TWO_COLUMNS'          // Title with two columns
  | 'TITLE_ONLY'                     // Just a title placeholder
  | 'SECTION_HEADER'                 // Section divider/break
  | 'SECTION_TITLE_AND_DESCRIPTION'  // Section title on one side, description on other
  | 'ONE_COLUMN_TEXT'                // Single column text layout
  | 'MAIN_POINT'                     // Emphasis layout for key points
  | 'BIG_NUMBER';                    // Large number display for stats
```

| Layout | Best For | Placeholders |
|--------|----------|--------------|
| BLANK | Custom content, images, diagrams | None |
| TITLE | Opening/closing slides | CENTERED_TITLE, SUBTITLE |
| TITLE_AND_BODY | Standard content slides | TITLE, BODY |
| TITLE_AND_TWO_COLUMNS | Comparisons, side-by-side | TITLE, BODY (x2) |
| TITLE_ONLY | Headers, transitions | TITLE |
| SECTION_HEADER | Chapter breaks | TITLE, SUBTITLE |
| SECTION_TITLE_AND_DESCRIPTION | Section intros | TITLE, BODY |
| ONE_COLUMN_TEXT | Long-form text | TITLE, BODY |
| MAIN_POINT | Key takeaways | TITLE |
| BIG_NUMBER | Statistics, metrics | TITLE, BODY |
| CAPTION_ONLY | Image with caption | BODY |

### 3.2 SlideInfo

Information about a slide.

```typescript
interface SlideInfo {
  objectId: string;
  index: number;               // 0-based position
  layout: string;
  placeholders: Placeholder[];
  elements: PageElement[];
}
```

### 3.3 Placeholder

A placeholder on a slide layout.

```typescript
interface Placeholder {
  objectId: string;
  type: PlaceholderType;
  index?: number;              // For multiple placeholders of same type
}

type PlaceholderType =
  | 'TITLE'
  | 'SUBTITLE'
  | 'BODY'
  | 'CENTERED_TITLE'
  | 'SLIDE_NUMBER';
```

---

## 4. MCP Tools

### 4.1 add_slide

**Purpose:** Adds a new slide to the presentation with a specified layout.

**Tool Definition:**

```typescript
{
  name: "add_slide",
  description: "Add a new slide to a presentation",
  inputSchema: {
    type: "object",
    properties: {
      presentationId: {
        type: "string",
        description: "The presentation to add a slide to"
      },
      layout: {
        type: "string",
        enum: [
          "BLANK", "TITLE", "TITLE_AND_BODY", "TITLE_AND_TWO_COLUMNS",
          "TITLE_ONLY", "SECTION_HEADER", "SECTION_TITLE_AND_DESCRIPTION",
          "ONE_COLUMN_TEXT", "MAIN_POINT", "BIG_NUMBER", "CAPTION_ONLY"
        ],
        description: "The predefined layout to use",
        default: "TITLE_AND_BODY"
      },
      insertionIndex: {
        type: "number",
        description: "Position to insert the slide (0-based). Omit to add at end."
      }
    },
    required: ["presentationId"]
  }
}
```

**Response:**

```typescript
{
  slideId: string;
  index: number;
  placeholders: Array<{
    objectId: string;
    type: string;
  }>;
}
```

**Example:**

```json
// Input
{
  "presentationId": "1BxiMVs...",
  "layout": "TITLE_AND_BODY",
  "insertionIndex": 1
}

// Output
{
  "slideId": "g123abc",
  "index": 1,
  "placeholders": [
    { "objectId": "g123abc_title", "type": "TITLE" },
    { "objectId": "g123abc_body", "type": "BODY" }
  ]
}
```

### 4.2 delete_slide

**Purpose:** Removes a slide from the presentation.

**Tool Definition:**

```typescript
{
  name: "delete_slide",
  description: "Delete a slide from a presentation",
  inputSchema: {
    type: "object",
    properties: {
      presentationId: {
        type: "string",
        description: "The presentation ID"
      },
      slideId: {
        type: "string",
        description: "The ID of the slide to delete"
      }
    },
    required: ["presentationId", "slideId"]
  }
}
```

**Response:**

```typescript
{
  deleted: true;
  remainingSlides: number;
}
```

### 4.3 reorder_slides

**Purpose:** Changes the order of slides in a presentation.

**Tool Definition:**

```typescript
{
  name: "reorder_slides",
  description: "Reorder slides in a presentation",
  inputSchema: {
    type: "object",
    properties: {
      presentationId: {
        type: "string",
        description: "The presentation ID"
      },
      slideIds: {
        type: "array",
        items: { type: "string" },
        description: "Slide IDs in their new order"
      },
      insertionIndex: {
        type: "number",
        description: "New starting position for the slides"
      }
    },
    required: ["presentationId", "slideIds", "insertionIndex"]
  }
}
```

### 4.4 get_slide

**Purpose:** Gets details about a specific slide.

**Tool Definition:**

```typescript
{
  name: "get_slide",
  description: "Get details about a specific slide",
  inputSchema: {
    type: "object",
    properties: {
      presentationId: {
        type: "string",
        description: "The presentation ID"
      },
      slideId: {
        type: "string",
        description: "The slide ID"
      }
    },
    required: ["presentationId", "slideId"]
  }
}
```

**Response:**

```typescript
{
  objectId: string;
  index: number;
  elements: Array<{
    objectId: string;
    type: string;           // 'SHAPE', 'IMAGE', 'TABLE', etc.
    description?: string;   // Brief description of content
  }>;
}
```

---

## 5. API Mapping

### batchUpdate Requests Used

| MCP Tool | Google API Request |
|----------|-------------------|
| add_slide | CreateSlideRequest |
| delete_slide | DeleteObjectRequest |
| reorder_slides | UpdateSlidesPositionRequest |
| get_slide | presentations.pages.get |

### CreateSlideRequest Structure

```typescript
{
  createSlide: {
    objectId?: string,                    // Optional custom ID (5-50 chars, alphanumeric/underscore start)
    insertionIndex?: number,              // 0-based position, omit to append
    slideLayoutReference: {
      predefinedLayout: PredefinedLayout  // OR use layoutId for custom layouts
    },
    placeholderIdMappings?: [{            // Optional: assign custom IDs to placeholders
      layoutPlaceholder: {
        type: PlaceholderType,            // e.g., 'TITLE', 'BODY'
        index: number                     // For multiple placeholders of same type
      },
      objectId: string                    // Custom ID to assign
    }]
  }
}
```

### Object ID Requirements

Object IDs (for slides, shapes, etc.) must follow these rules:
- Length: 5-50 characters
- Must start with: alphanumeric `[a-zA-Z0-9]` or underscore `_`
- Subsequent characters: alphanumeric, underscore, dash `-`, or colon `:`

---

## 6. Implementation Notes

### Placeholder ID Discovery

When a slide is created, the response includes the generated object IDs for placeholders. These IDs are needed for subsequent content insertion. The `add_slide` tool should parse the response to extract placeholder mappings.

### Layout Availability

Not all layouts may exist in every presentation theme. If a layout isn't available, the API returns an error. The tool should:
1. Attempt the requested layout
2. Fall back to BLANK if the layout isn't available
3. Return a warning in the response

---

## 7. Error Handling

| Error Code | Condition | User Message |
|------------|-----------|--------------|
| INVALID_LAYOUT | Layout not in presentation theme | "Layout not available, using BLANK" |
| SLIDE_NOT_FOUND | Invalid slide ID | "Slide not found" |
| CANNOT_DELETE_ONLY_SLIDE | Attempt to delete last slide | "Cannot delete the only slide" |
| INVALID_INDEX | Index out of range | "Invalid slide position" |

---

## 8. Implementation Phases

| Phase | Description | Dependencies | Complexity |
|-------|-------------|--------------|------------|
| 1 | add_slide with basic layouts | Presentation tools | Low |
| 2 | get_slide tool | Phase 1 | Low |
| 3 | delete_slide tool | Phase 1 | Low |
| 4 | reorder_slides tool | Phase 1 | Medium |
| 5 | Placeholder discovery | Phase 1 | Medium |
