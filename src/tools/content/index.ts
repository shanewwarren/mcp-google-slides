/**
 * Content insertion tools
 *
 * MCP tools for adding various content types to slides: text, images, shapes, tables, and speaker notes.
 */

import {
  insertText,
  InsertTextInputSchema,
  type InsertTextInput,
  type InsertTextOutput,
} from './insert-text.js';

/**
 * Export all content tool implementations
 */
export { insertText };

/**
 * Export all content tool types
 */
export type { InsertTextInput, InsertTextOutput };

/**
 * Export all content tool schemas
 */
export { InsertTextInputSchema };

/**
 * MCP tool definitions for content insertion
 */
export const contentTools = [
  {
    name: 'insert_text',
    description: 'Insert text into a slide placeholder or create a text box',
    inputSchema: {
      type: 'object',
      properties: {
        presentationId: {
          type: 'string',
          description: 'The presentation ID',
        },
        slideId: {
          type: 'string',
          description: 'The slide to add text to',
        },
        text: {
          type: 'string',
          description: 'The text content to insert',
        },
        placeholderId: {
          type: 'string',
          description:
            'ID of an existing placeholder to fill. If omitted, creates a text box.',
        },
        position: {
          type: 'object',
          description:
            'Position for new text box (ignored if placeholderId provided)',
          properties: {
            x: { type: 'number', description: 'Left edge in inches' },
            y: { type: 'number', description: 'Top edge in inches' },
            width: { type: 'number', description: 'Width in inches' },
            height: { type: 'number', description: 'Height in inches' },
          },
          required: ['x', 'y', 'width', 'height'],
        },
      },
      required: ['presentationId', 'slideId', 'text'],
    },
  },
] as const;
