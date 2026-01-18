/**
 * Text formatting tools
 *
 * MCP tools for styling and formatting text: fonts, colors, alignment, bullets.
 */

import {
  type CreateBulletsInput,
  CreateBulletsInputSchema,
  type CreateBulletsOutput,
  createBullets,
} from './create-bullets.js';

import {
  type FormatParagraphInput,
  FormatParagraphInputSchema,
  type FormatParagraphOutput,
  formatParagraph,
} from './format-paragraph.js';
import {
  type FormatTextInput,
  FormatTextInputSchema,
  type FormatTextOutput,
  formatText,
} from './format-text.js';

/**
 * Export all formatting tool implementations
 */
export { formatText, formatParagraph, createBullets };

/**
 * Export all formatting tool types
 */
export type {
  FormatTextInput,
  FormatTextOutput,
  FormatParagraphInput,
  FormatParagraphOutput,
  CreateBulletsInput,
  CreateBulletsOutput,
};

/**
 * Export all formatting tool schemas
 */
export { FormatTextInputSchema, FormatParagraphInputSchema, CreateBulletsInputSchema };

/**
 * MCP tool definitions for text formatting
 */
export const formattingTools = [
  {
    name: 'format_text',
    description: 'Apply formatting (font, size, color, bold, etc.) to text',
    inputSchema: {
      type: 'object',
      properties: {
        presentationId: {
          type: 'string',
          description: 'The presentation ID',
        },
        objectId: {
          type: 'string',
          description: 'ID of the shape/text box containing the text',
        },
        style: {
          type: 'object',
          description: 'Text style to apply',
          properties: {
            fontFamily: {
              type: 'string',
              description: 'Font name (e.g., "Arial", "Roboto")',
            },
            fontSize: {
              type: 'number',
              description: 'Font size in points',
            },
            bold: {
              type: 'boolean',
              description: 'Bold weight',
            },
            italic: {
              type: 'boolean',
              description: 'Italic style',
            },
            underline: {
              type: 'boolean',
              description: 'Underline decoration',
            },
            strikethrough: {
              type: 'boolean',
              description: 'Strikethrough decoration',
            },
            foregroundColor: {
              type: 'string',
              description: 'Text color (hex, RGB, or named)',
            },
            backgroundColor: {
              type: 'string',
              description: 'Highlight color (hex, RGB, or named)',
            },
            link: {
              type: 'string',
              description: 'URL to create a hyperlink',
            },
          },
        },
        range: {
          type: 'object',
          description: 'Text range to format. Omit to format all text.',
          properties: {
            startIndex: {
              type: 'number',
              description: 'Start index (0-based)',
            },
            endIndex: {
              type: 'number',
              description: 'End index (exclusive). Omit for "to end"',
            },
          },
          required: ['startIndex'],
        },
      },
      required: ['presentationId', 'objectId', 'style'],
    },
  },
  {
    name: 'format_paragraph',
    description: 'Apply paragraph formatting (alignment, spacing, indentation)',
    inputSchema: {
      type: 'object',
      properties: {
        presentationId: {
          type: 'string',
          description: 'The presentation ID',
        },
        objectId: {
          type: 'string',
          description: 'ID of the shape/text box',
        },
        style: {
          type: 'object',
          description: 'Paragraph style to apply',
          properties: {
            alignment: {
              type: 'string',
              enum: ['START', 'CENTER', 'END', 'JUSTIFIED'],
              description: 'Text alignment',
            },
            lineSpacing: {
              type: 'number',
              description: 'Line spacing percentage (100 = single, 150 = 1.5x)',
            },
            spaceBefore: {
              type: 'number',
              description: 'Space before paragraph in points',
            },
            spaceAfter: {
              type: 'number',
              description: 'Space after paragraph in points',
            },
            indentStart: {
              type: 'number',
              description: 'Left indent in points',
            },
            indentFirstLine: {
              type: 'number',
              description: 'First line indent in points (can be negative for hanging indent)',
            },
          },
        },
        range: {
          type: 'object',
          description: 'Range to format. Omit to format all paragraphs.',
          properties: {
            startIndex: {
              type: 'number',
              description: 'Start index (0-based)',
            },
            endIndex: {
              type: 'number',
              description: 'End index (exclusive). Omit for "to end"',
            },
          },
          required: ['startIndex'],
        },
      },
      required: ['presentationId', 'objectId', 'style'],
    },
  },
  {
    name: 'create_bullets',
    description: 'Create a bulleted or numbered list from text paragraphs',
    inputSchema: {
      type: 'object',
      properties: {
        presentationId: {
          type: 'string',
          description: 'The presentation ID',
        },
        objectId: {
          type: 'string',
          description: 'ID of the shape/text box',
        },
        bulletPreset: {
          type: 'string',
          enum: [
            'BULLET_DISC_CIRCLE_SQUARE',
            'BULLET_DIAMONDX_ARROW3D_SQUARE',
            'BULLET_CHECKBOX',
            'BULLET_ARROW_DIAMOND_DISC',
            'BULLET_STAR_CIRCLE_SQUARE',
            'BULLET_ARROW3D_CIRCLE_SQUARE',
            'NUMBERED_DIGIT_ALPHA_ROMAN',
            'NUMBERED_DIGIT_ALPHA_ROMAN_PARENS',
            'NUMBERED_DIGIT_NESTED',
            'NUMBERED_UPPERALPHA_ALPHA_ROMAN',
            'NUMBERED_UPPERROMAN_UPPERALPHA_DIGIT',
          ],
          description:
            'Preset bullet/number style (determines appearance at all nesting levels). Default: BULLET_DISC_CIRCLE_SQUARE',
        },
        range: {
          type: 'object',
          description: 'Range to apply bullets to. Omit for all text.',
          properties: {
            startIndex: {
              type: 'number',
              description: 'Start index (0-based)',
            },
            endIndex: {
              type: 'number',
              description: 'End index (exclusive). Omit for "to end"',
            },
          },
          required: ['startIndex'],
        },
      },
      required: ['presentationId', 'objectId'],
    },
  },
] as const;
