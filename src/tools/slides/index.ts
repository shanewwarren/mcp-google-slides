/**
 * Slide operation tools
 *
 * MCP tools for adding, deleting, reordering, and retrieving slides.
 */

import {
  addSlide,
  AddSlideInputSchema,
  type AddSlideInput,
  type AddSlideOutput,
} from './add-slide.js';

/**
 * Export all slide tool implementations
 */
export {
  addSlide,
};

/**
 * Export all slide tool types
 */
export type {
  AddSlideInput,
  AddSlideOutput,
};

/**
 * Export all slide tool schemas
 */
export {
  AddSlideInputSchema,
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
] as const;
