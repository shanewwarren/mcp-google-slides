/**
 * Presentation management tools
 *
 * MCP tools for creating, retrieving, and listing Google Slides presentations.
 */

import {
  type CreatePresentationInput,
  CreatePresentationInputSchema,
  type CreatePresentationOutput,
  createPresentation,
} from './create.js';
import {
  type GetPresentationInput,
  GetPresentationInputSchema,
  type GetPresentationOutput,
  getPresentation,
} from './get.js';
import {
  type ListPresentationsInput,
  ListPresentationsInputSchema,
  type ListPresentationsOutput,
  listPresentations,
} from './list.js';

/**
 * Export all presentation tool implementations
 */
export { createPresentation, getPresentation, listPresentations };

/**
 * Export all presentation tool types
 */
export type {
  CreatePresentationInput,
  CreatePresentationOutput,
  GetPresentationInput,
  GetPresentationOutput,
  ListPresentationsInput,
  ListPresentationsOutput,
};

/**
 * Export all presentation tool schemas
 */
export { CreatePresentationInputSchema, GetPresentationInputSchema, ListPresentationsInputSchema };

/**
 * MCP tool definitions for presentation management
 */
export const presentationTools = [
  {
    name: 'create_presentation',
    description: 'Create a new Google Slides presentation',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Title for the new presentation',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'get_presentation',
    description: 'Get details of a Google Slides presentation',
    inputSchema: {
      type: 'object',
      properties: {
        presentationId: {
          type: 'string',
          description: 'The ID of the presentation to retrieve',
        },
      },
      required: ['presentationId'],
    },
  },
  {
    name: 'list_presentations',
    description: 'List Google Slides presentations created by this app',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of presentations to return',
          default: 10,
        },
      },
    },
  },
] as const;
