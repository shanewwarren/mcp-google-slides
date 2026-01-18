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
import {
  createShape,
  CreateShapeInputSchema,
  type CreateShapeInput,
  type CreateShapeOutput,
} from './create-shape.js';
import {
  createTable,
  CreateTableInputSchema,
  type CreateTableInput,
  type CreateTableOutput,
} from './create-table.js';
import {
  setSpeakerNotes,
  SetSpeakerNotesInputSchema,
  type SetSpeakerNotesInput,
  type SetSpeakerNotesOutput,
} from './set-speaker-notes.js';

/**
 * Export all content tool implementations
 */
export { insertText, insertImage, createShape, createTable, setSpeakerNotes };

/**
 * Export all content tool types
 */
export type {
  InsertTextInput,
  InsertTextOutput,
  InsertImageInput,
  InsertImageOutput,
  CreateShapeInput,
  CreateShapeOutput,
  CreateTableInput,
  CreateTableOutput,
  SetSpeakerNotesInput,
  SetSpeakerNotesOutput,
};

/**
 * Export all content tool schemas
 */
export {
  InsertTextInputSchema,
  InsertImageInputSchema,
  CreateShapeInputSchema,
  CreateTableInputSchema,
  SetSpeakerNotesInputSchema,
};

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
  {
    name: 'create_shape',
    description: 'Create a shape on a slide',
    inputSchema: {
      type: 'object',
      properties: {
        presentationId: {
          type: 'string',
          description: 'The presentation ID',
        },
        slideId: {
          type: 'string',
          description: 'The slide to add the shape to',
        },
        shapeType: {
          type: 'string',
          enum: [
            'RECTANGLE',
            'ROUND_RECTANGLE',
            'ELLIPSE',
            'TRIANGLE',
            'PARALLELOGRAM',
            'TRAPEZOID',
            'PENTAGON',
            'HEXAGON',
            'DIAMOND',
            'RIGHT_ARROW',
            'LEFT_ARROW',
            'UP_ARROW',
            'DOWN_ARROW',
            'LEFT_RIGHT_ARROW',
            'UP_DOWN_ARROW',
            'BENT_ARROW',
            'CURVED_RIGHT_ARROW',
            'STAR_4',
            'STAR_5',
            'STAR_6',
            'STAR_8',
            'RIBBON',
            'RIBBON_2',
            'CALLOUT_RECTANGLE',
            'CALLOUT_ROUND_RECTANGLE',
            'CALLOUT_ELLIPSE',
            'TEXT_BOX',
            'CLOUD',
            'HEART',
            'PLUS',
            'WAVE',
          ],
          description: 'The type of shape to create',
        },
        position: {
          type: 'object',
          description: 'Position and size for the shape',
          properties: {
            x: { type: 'number', description: 'Left edge in inches' },
            y: { type: 'number', description: 'Top edge in inches' },
            width: { type: 'number', description: 'Width in inches' },
            height: { type: 'number', description: 'Height in inches' },
          },
          required: ['x', 'y', 'width', 'height'],
        },
        fillColor: {
          type: 'string',
          description: "Fill color as hex (e.g., '#FF5733') or color name",
        },
        text: {
          type: 'string',
          description: 'Optional text to place inside the shape',
        },
      },
      required: ['presentationId', 'slideId', 'shapeType', 'position'],
    },
  },
  {
    name: 'create_table',
    description: 'Create a table on a slide',
    inputSchema: {
      type: 'object',
      properties: {
        presentationId: {
          type: 'string',
          description: 'The presentation ID',
        },
        slideId: {
          type: 'string',
          description: 'The slide to add the table to',
        },
        rows: {
          type: 'number',
          description: 'Number of rows (1-25)',
        },
        columns: {
          type: 'number',
          description: 'Number of columns (1-20)',
        },
        position: {
          type: 'object',
          description: 'Position and size for the table',
          properties: {
            x: { type: 'number', description: 'Left edge in inches' },
            y: { type: 'number', description: 'Top edge in inches' },
            width: { type: 'number', description: 'Width in inches' },
            height: { type: 'number', description: 'Height in inches' },
          },
          required: ['x', 'y', 'width', 'height'],
        },
        data: {
          type: 'array',
          description: 'Table data as 2D array of strings (row-major order)',
          items: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      required: ['presentationId', 'slideId', 'rows', 'columns', 'position'],
    },
  },
  {
    name: 'set_speaker_notes',
    description: 'Add or update speaker notes for a slide',
    inputSchema: {
      type: 'object',
      properties: {
        presentationId: {
          type: 'string',
          description: 'The presentation ID',
        },
        slideId: {
          type: 'string',
          description: 'The slide to add notes to',
        },
        notes: {
          type: 'string',
          description: 'The speaker notes content (plain text or simple formatting)',
        },
      },
      required: ['presentationId', 'slideId', 'notes'],
    },
  },
] as const;
