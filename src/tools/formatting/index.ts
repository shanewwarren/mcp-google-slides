/**
 * Text formatting tools
 *
 * MCP tools for styling and formatting text: fonts, colors, alignment, bullets.
 */

import {
  formatText,
  FormatTextInputSchema,
  type FormatTextInput,
  type FormatTextOutput,
} from './format-text.js';

/**
 * Export all formatting tool implementations
 */
export { formatText };

/**
 * Export all formatting tool types
 */
export type {
  FormatTextInput,
  FormatTextOutput,
};

/**
 * Export all formatting tool schemas
 */
export {
  FormatTextInputSchema,
};

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
] as const;
