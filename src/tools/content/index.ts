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
import {
  insertImage,
  InsertImageInputSchema,
  type InsertImageInput,
  type InsertImageOutput,
} from './insert-image.js';

/**
 * Export all content tool implementations
 */
export { insertText, insertImage };

/**
 * Export all content tool types
 */
export type { InsertTextInput, InsertTextOutput, InsertImageInput, InsertImageOutput };

/**
 * Export all content tool schemas
 */
export { InsertTextInputSchema, InsertImageInputSchema };

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
  {
    name: 'insert_image',
    description: 'Insert an image onto a slide from a URL',
    inputSchema: {
      type: 'object',
      properties: {
        presentationId: {
          type: 'string',
          description: 'The presentation ID',
        },
        slideId: {
          type: 'string',
          description: 'The slide to add the image to',
        },
        imageUrl: {
          type: 'string',
          description: 'URL of the image to insert (must be publicly accessible)',
        },
        position: {
          type: 'object',
          description: 'Position and size for the image',
          properties: {
            x: { type: 'number', description: 'Left edge in inches' },
            y: { type: 'number', description: 'Top edge in inches' },
            width: { type: 'number', description: 'Width in inches' },
            height: { type: 'number', description: 'Height in inches' },
          },
          required: ['x', 'y', 'width', 'height'],
        },
        altText: {
          type: 'string',
          description: 'Alt text for accessibility',
        },
      },
      required: ['presentationId', 'slideId', 'imageUrl', 'position'],
    },
  },
] as const;
