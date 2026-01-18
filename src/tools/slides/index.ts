/**
 * Slide operation tools
 *
 * MCP tools for adding, deleting, reordering, and retrieving slides.
 */

import {
  type AddSlideInput,
  AddSlideInputSchema,
  type AddSlideOutput,
  addSlide,
} from './add-slide.js';
import {
  type DeleteSlideInput,
  DeleteSlideInputSchema,
  type DeleteSlideOutput,
  deleteSlide,
} from './delete-slide.js';
import {
  type GetSlideInput,
  GetSlideInputSchema,
  type GetSlideOutput,
  getSlide,
} from './get-slide.js';
import {
  type ReorderSlidesInput,
  ReorderSlidesInputSchema,
  type ReorderSlidesOutput,
  reorderSlides,
} from './reorder-slides.js';

/**
 * Export all slide tool implementations
 */
export { addSlide, getSlide, deleteSlide, reorderSlides };

/**
 * Export all slide tool types
 */
export type {
  AddSlideInput,
  AddSlideOutput,
  GetSlideInput,
  GetSlideOutput,
  DeleteSlideInput,
  DeleteSlideOutput,
  ReorderSlidesInput,
  ReorderSlidesOutput,
};

/**
 * Export all slide tool schemas
 */
export {
  AddSlideInputSchema,
  GetSlideInputSchema,
  DeleteSlideInputSchema,
  ReorderSlidesInputSchema,
};

/**
 * MCP tool definitions for slide operations
 */
export const slideTools = [
  {
    name: 'add_slide',
    description: 'Add a new slide to a presentation',
    inputSchema: {
      type: 'object',
      properties: {
        presentationId: {
          type: 'string',
          description: 'The presentation to add a slide to',
        },
        layout: {
          type: 'string',
          enum: [
            'BLANK',
            'TITLE',
            'TITLE_AND_BODY',
            'TITLE_AND_TWO_COLUMNS',
            'TITLE_ONLY',
            'SECTION_HEADER',
            'SECTION_TITLE_AND_DESCRIPTION',
            'ONE_COLUMN_TEXT',
            'MAIN_POINT',
            'BIG_NUMBER',
            'CAPTION_ONLY',
          ],
          description: 'The predefined layout to use',
          default: 'TITLE_AND_BODY',
        },
        insertionIndex: {
          type: 'number',
          description: 'Position to insert the slide (0-based). Omit to add at end.',
        },
      },
      required: ['presentationId'],
    },
  },
  {
    name: 'get_slide',
    description: 'Get details about a specific slide',
    inputSchema: {
      type: 'object',
      properties: {
        presentationId: {
          type: 'string',
          description: 'The presentation ID',
        },
        slideId: {
          type: 'string',
          description: 'The slide ID',
        },
      },
      required: ['presentationId', 'slideId'],
    },
  },
  {
    name: 'delete_slide',
    description: 'Delete a slide from a presentation',
    inputSchema: {
      type: 'object',
      properties: {
        presentationId: {
          type: 'string',
          description: 'The presentation ID',
        },
        slideId: {
          type: 'string',
          description: 'The ID of the slide to delete',
        },
      },
      required: ['presentationId', 'slideId'],
    },
  },
  {
    name: 'reorder_slides',
    description: 'Reorder slides in a presentation',
    inputSchema: {
      type: 'object',
      properties: {
        presentationId: {
          type: 'string',
          description: 'The presentation ID',
        },
        slideIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Slide IDs in their new order',
        },
        insertionIndex: {
          type: 'number',
          description: 'New starting position for the slides',
        },
      },
      required: ['presentationId', 'slideIds', 'insertionIndex'],
    },
  },
] as const;
