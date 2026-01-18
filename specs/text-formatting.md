# Text Formatting Specification

**Status:** Implemented
**Version:** 1.0
**Last Updated:** 2026-01-18

---

## 1. Overview

### Purpose

Provides MCP tools for styling and formatting text within slides. Enables LLMs to create visually polished presentations with proper typography, colors, and list formatting.

### Goals

- **Text styling** - Apply fonts, sizes, colors, bold, italic, underline
- **Paragraph formatting** - Alignment, line spacing, indentation
- **Bullet lists** - Create bulleted and numbered lists
- **Range-based formatting** - Style specific portions of text

### Non-Goals

- **Custom fonts** - Only Google Slides built-in fonts supported
- **Advanced typography** - Kerning, ligatures, etc. not supported
- **Text effects** - Shadows, glow, 3D effects not in scope

---

## 2. Architecture

### Component Structure

```
src/
├── tools/
│   └── formatting/
│       ├── format-text.ts       # format_text tool
│       ├── format-paragraph.ts  # format_paragraph tool
│       ├── create-bullets.ts    # create_bullets tool
│       └── index.ts
└── utils/
    └── colors.ts                # Color parsing utilities
```

---

## 3. Core Types

### 3.1 TextStyle

Text character styling options.

```typescript
interface TextStyle {
  fontFamily?: string;
  fontSize?: number;           // In points
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  foregroundColor?: string;    // Hex color
  backgroundColor?: string;    // Hex color (highlight)
  link?: string;               // URL to link to
}
```

| Field | Type | Description |
|-------|------|-------------|
| fontFamily | string | Font name (e.g., "Arial", "Roboto", "Times New Roman") |
| fontSize | number | Size in points (e.g., 24, 36, 48) |
| bold | boolean | Bold weight |
| italic | boolean | Italic style |
| underline | boolean | Underline decoration |
| strikethrough | boolean | Strikethrough decoration |
| foregroundColor | string | Text color as hex (#RRGGBB) |
| backgroundColor | string | Highlight color as hex |
| link | string | URL to create a hyperlink |

### 3.2 ParagraphStyle

Paragraph-level formatting options.

```typescript
interface ParagraphStyle {
  alignment?: 'START' | 'CENTER' | 'END' | 'JUSTIFIED';
  lineSpacing?: number;        // Percentage (100 = single, 150 = 1.5x)
  spaceBefore?: number;        // Points before paragraph
  spaceAfter?: number;         // Points after paragraph
  indentStart?: number;        // Left indent in points
  indentFirstLine?: number;    // First line indent in points
}
```

### 3.3 TextRange

Specifies a range of text to format.

```typescript
interface TextRange {
  startIndex: number;          // 0-based character index
  endIndex?: number;           // End index (exclusive). Omit for "to end"
}
```

### 3.4 BulletPreset

The Google Slides API uses preset bullet configurations rather than individual type selection. Each preset defines bullet/number styles for multiple nesting levels.

```typescript
type BulletPreset =
  // Bullet styles
  | 'BULLET_DISC_CIRCLE_SQUARE'        // •, ◦, ▪ (default bullet)
  | 'BULLET_DIAMONDX_ARROW3D_SQUARE'   // ◇, ➢, ▪
  | 'BULLET_CHECKBOX'                  // ☐
  | 'BULLET_ARROW_DIAMOND_DISC'        // ➤, ◆, •
  | 'BULLET_STAR_CIRCLE_SQUARE'        // ★, ○, ▪
  | 'BULLET_ARROW3D_CIRCLE_SQUARE'     // ➢, ○, ▪
  // Numbered styles
  | 'NUMBERED_DIGIT_ALPHA_ROMAN'       // 1, a, i (default numbered)
  | 'NUMBERED_DIGIT_ALPHA_ROMAN_PARENS'// 1), a), i)
  | 'NUMBERED_DIGIT_NESTED'            // 1., 1.1., 1.1.1.
  | 'NUMBERED_UPPERALPHA_ALPHA_ROMAN'  // A, a, i
  | 'NUMBERED_UPPERROMAN_UPPERALPHA_DIGIT'; // I, A, 1
```

| Preset | Level 1 | Level 2 | Level 3 |
|--------|---------|---------|---------|
| BULLET_DISC_CIRCLE_SQUARE | • | ◦ | ▪ |
| NUMBERED_DIGIT_ALPHA_ROMAN | 1. | a. | i. |
| NUMBERED_DIGIT_NESTED | 1. | 1.1. | 1.1.1. |

---

## 4. MCP Tools

### 4.1 format_text

**Purpose:** Applies character-level formatting to text.

**Tool Definition:**

```typescript
{
  name: "format_text",
  description: "Apply formatting (font, size, color, bold, etc.) to text",
  inputSchema: {
    type: "object",
    properties: {
      presentationId: {
        type: "string",
        description: "The presentation ID"
      },
      objectId: {
        type: "string",
        description: "ID of the shape/text box containing the text"
      },
      style: {
        type: "object",
        description: "Text style to apply",
        properties: {
          fontFamily: { type: "string" },
          fontSize: { type: "number" },
          bold: { type: "boolean" },
          italic: { type: "boolean" },
          underline: { type: "boolean" },
          strikethrough: { type: "boolean" },
          foregroundColor: { type: "string" },
          backgroundColor: { type: "string" },
          link: { type: "string" }
        }
      },
      range: {
        type: "object",
        description: "Text range to format. Omit to format all text.",
        properties: {
          startIndex: { type: "number" },
          endIndex: { type: "number" }
        }
      }
    },
    required: ["presentationId", "objectId", "style"]
  }
}
```

**Example - Format title:**

```json
{
  "presentationId": "1BxiMVs...",
  "objectId": "g123abc_title",
  "style": {
    "fontFamily": "Roboto",
    "fontSize": 44,
    "bold": true,
    "foregroundColor": "#1a73e8"
  }
}
```

**Example - Format specific word:**

```json
{
  "presentationId": "1BxiMVs...",
  "objectId": "g123abc_body",
  "style": {
    "bold": true,
    "foregroundColor": "#d93025"
  },
  "range": {
    "startIndex": 0,
    "endIndex": 9
  }
}
```

### 4.2 format_paragraph

**Purpose:** Applies paragraph-level formatting.

**Tool Definition:**

```typescript
{
  name: "format_paragraph",
  description: "Apply paragraph formatting (alignment, spacing, indentation)",
  inputSchema: {
    type: "object",
    properties: {
      presentationId: {
        type: "string",
        description: "The presentation ID"
      },
      objectId: {
        type: "string",
        description: "ID of the shape/text box"
      },
      style: {
        type: "object",
        properties: {
          alignment: {
            type: "string",
            enum: ["START", "CENTER", "END", "JUSTIFIED"]
          },
          lineSpacing: { type: "number" },
          spaceBefore: { type: "number" },
          spaceAfter: { type: "number" },
          indentStart: { type: "number" },
          indentFirstLine: { type: "number" }
        }
      },
      range: {
        type: "object",
        description: "Range to format. Omit to format all paragraphs.",
        properties: {
          startIndex: { type: "number" },
          endIndex: { type: "number" }
        }
      }
    },
    required: ["presentationId", "objectId", "style"]
  }
}
```

**Example:**

```json
{
  "presentationId": "1BxiMVs...",
  "objectId": "g123abc_body",
  "style": {
    "alignment": "CENTER",
    "lineSpacing": 150,
    "spaceAfter": 12
  }
}
```

### 4.3 create_bullets

**Purpose:** Converts text paragraphs into a bulleted or numbered list.

**Tool Definition:**

```typescript
{
  name: "create_bullets",
  description: "Create a bulleted or numbered list from text paragraphs",
  inputSchema: {
    type: "object",
    properties: {
      presentationId: {
        type: "string",
        description: "The presentation ID"
      },
      objectId: {
        type: "string",
        description: "ID of the shape/text box"
      },
      bulletPreset: {
        type: "string",
        enum: [
          "BULLET_DISC_CIRCLE_SQUARE",
          "BULLET_CHECKBOX",
          "NUMBERED_DIGIT_ALPHA_ROMAN",
          "NUMBERED_DIGIT_NESTED"
        ],
        default: "BULLET_DISC_CIRCLE_SQUARE",
        description: "Preset bullet/number style (determines appearance at all nesting levels)"
      },
      range: {
        type: "object",
        description: "Range to apply bullets to. Omit for all text.",
        properties: {
          startIndex: { type: "number" },
          endIndex: { type: "number" }
        }
      }
    },
    required: ["presentationId", "objectId"]
  }
}
```

### 4.4 remove_bullets

**Purpose:** Removes bullet formatting from text.

**Tool Definition:**

```typescript
{
  name: "remove_bullets",
  description: "Remove bullet or number formatting from text",
  inputSchema: {
    type: "object",
    properties: {
      presentationId: { type: "string" },
      objectId: { type: "string" },
      range: {
        type: "object",
        properties: {
          startIndex: { type: "number" },
          endIndex: { type: "number" }
        }
      }
    },
    required: ["presentationId", "objectId"]
  }
}
```

---

## 5. API Mapping

### batchUpdate Requests Used

| MCP Tool | Google API Request |
|----------|-------------------|
| format_text | UpdateTextStyleRequest |
| format_paragraph | UpdateParagraphStyleRequest |
| create_bullets | CreateParagraphBulletsRequest |
| remove_bullets | DeleteParagraphBulletsRequest |

### UpdateParagraphStyleRequest Structure

```typescript
{
  updateParagraphStyle: {
    objectId: string,
    textRange: {
      type: 'FIXED_RANGE' | 'FROM_START_INDEX' | 'ALL',
      startIndex?: number,
      endIndex?: number
    },
    style: {
      alignment?: 'START' | 'CENTER' | 'END' | 'JUSTIFIED',
      lineSpacing?: number,          // Percentage (100 = single space)
      direction?: 'LEFT_TO_RIGHT' | 'RIGHT_TO_LEFT',
      spacingMode?: 'NEVER_COLLAPSE' | 'COLLAPSE_LISTS',
      spaceAbove?: { magnitude: number, unit: 'PT' },
      spaceBelow?: { magnitude: number, unit: 'PT' },
      indentStart?: { magnitude: number, unit: 'PT' },
      indentEnd?: { magnitude: number, unit: 'PT' },
      indentFirstLine?: { magnitude: number, unit: 'PT' }
    },
    fields: string                   // Field mask
  }
}
```

### CreateParagraphBulletsRequest Structure

```typescript
{
  createParagraphBullets: {
    objectId: string,
    textRange: {
      type: 'FIXED_RANGE' | 'FROM_START_INDEX' | 'ALL',
      startIndex?: number,
      endIndex?: number
    },
    bulletPreset:
      | 'BULLET_DISC_CIRCLE_SQUARE'      // Standard bullets
      | 'BULLET_DIAMONDX_ARROW3D_SQUARE' // Decorative bullets
      | 'BULLET_CHECKBOX'                // Checkbox style
      | 'BULLET_ARROW_DIAMOND_DISC'      // Arrow bullets
      | 'BULLET_STAR_CIRCLE_SQUARE'      // Star bullets
      | 'BULLET_ARROW3D_CIRCLE_SQUARE'   // 3D arrow bullets
      | 'NUMBERED_DIGIT_ALPHA_ROMAN'     // 1, a, i
      | 'NUMBERED_DIGIT_ALPHA_ROMAN_PARENS' // 1), a), i)
      | 'NUMBERED_DIGIT_NESTED'          // 1.1, 1.2
      | 'NUMBERED_UPPERALPHA_ALPHA_ROMAN'  // A, a, i
      | 'NUMBERED_UPPERROMAN_UPPERALPHA_DIGIT'  // I, A, 1
  }
}
```

### UpdateTextStyleRequest Structure

```typescript
{
  updateTextStyle: {
    objectId: string,          // ID of shape containing text
    textRange: {
      type: 'FIXED_RANGE' | 'FROM_START_INDEX' | 'ALL',
      startIndex?: number,     // Required for FIXED_RANGE and FROM_START_INDEX
      endIndex?: number        // Required for FIXED_RANGE only
    },
    style: {
      fontFamily?: string,
      fontSize?: { magnitude: number, unit: 'PT' },
      bold?: boolean,
      italic?: boolean,
      underline?: boolean,
      strikethrough?: boolean,
      smallCaps?: boolean,
      foregroundColor?: {
        opaqueColor: {
          rgbColor: { red: number, green: number, blue: number }  // Values 0.0-1.0
        }
      },
      backgroundColor?: {
        opaqueColor: {
          rgbColor: { red: number, green: number, blue: number }
        }
      },
      link?: {
        url: string            // Creates a hyperlink
      },
      baselineOffset?: 'NONE' | 'SUPERSCRIPT' | 'SUBSCRIPT',
      weightedFontFamily?: {
        fontFamily: string,
        weight: number         // 100-900
      }
    },
    fields: string             // Field mask, e.g., "bold,foregroundColor"
  }
}
```

**Important:** The `fields` parameter is required and specifies which style properties to update. Only listed fields will be modified; others remain unchanged.

---

## 6. Color Utilities

### Supported Color Formats

The tools accept colors in multiple formats:

| Format | Example | Description |
|--------|---------|-------------|
| Hex | `#FF5733` | 6-digit hex color |
| Hex short | `#F53` | 3-digit hex (expanded to 6) |
| RGB | `rgb(255, 87, 51)` | CSS RGB format |
| Named | `red`, `blue` | Common color names |

### Color Conversion

All formats are converted to Google's RGB color format:

```typescript
interface RgbColor {
  red: number;    // 0.0 - 1.0
  green: number;  // 0.0 - 1.0
  blue: number;   // 0.0 - 1.0
}
```

---

## 7. Common Font Families

Google Slides supports these font families (among others):

| Category | Fonts |
|----------|-------|
| Sans-serif | Arial, Roboto, Open Sans, Lato, Montserrat |
| Serif | Times New Roman, Georgia, Playfair Display |
| Monospace | Courier New, Roboto Mono, Source Code Pro |
| Display | Lobster, Pacifico, Oswald |

---

## 8. Error Handling

| Error Code | Condition | User Message |
|------------|-----------|--------------|
| OBJECT_NOT_FOUND | Invalid object ID | "Text element not found" |
| INVALID_RANGE | Range outside text bounds | "Text range is invalid" |
| UNSUPPORTED_FONT | Font not available | "Font not available, using default" |
| INVALID_COLOR | Cannot parse color | "Invalid color format" |

---

## 9. Implementation Phases

| Phase | Description | Dependencies | Complexity |
|-------|-------------|--------------|------------|
| 1 | format_text basic (bold, italic, color) | Content insertion | Low |
| 2 | format_text fonts and sizes | Phase 1 | Low |
| 3 | format_paragraph | Phase 1 | Medium |
| 4 | create_bullets/remove_bullets | Phase 1 | Medium |
| 5 | Range-based formatting | Phase 1-4 | Medium |
| 6 | Color parsing utilities | None | Low |

---

## 10. Usage Patterns

### Common Formatting Workflows

**Style a title slide:**
```
1. insert_text (title placeholder) → "Company Name"
2. format_text → fontSize: 60, bold: true, foregroundColor: "#1a73e8"
3. insert_text (subtitle placeholder) → "Quarterly Review"
4. format_text → fontSize: 32, italic: true
```

**Create a bullet list:**
```
1. insert_text (body placeholder) → "Point 1\nPoint 2\nPoint 3"
2. create_bullets → bulletType: "BULLET"
3. format_text → fontSize: 24
```

**Highlight key text:**
```
1. format_text → range: {0, 10}, bold: true, foregroundColor: "#d93025"
```
