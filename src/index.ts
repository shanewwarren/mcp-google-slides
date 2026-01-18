#!/usr/bin/env node

/**
 * MCP Google Slides Server
 *
 * An MCP server that enables LLMs to create and manage Google Slides presentations
 * with zero-config OAuth authentication.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  presentationTools,
  createPresentation,
  getPresentation,
  listPresentations,
  slideTools,
  addSlide,
  getSlide,
  deleteSlide,
  reorderSlides,
} from './tools/index.js';

/**
 * MCP Server instance
 */
const server = new Server(
  {
    name: 'mcp-google-slides',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List all available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [...presentationTools, ...slideTools],
  };
});

/**
 * Handle tool execution requests
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case 'create_presentation':
        result = await createPresentation(args as any);
        break;

      case 'get_presentation':
        result = await getPresentation(args as any);
        break;

      case 'list_presentations':
        result = await listPresentations(args as any);
        break;

      case 'add_slide':
        result = await addSlide(args as any);
        break;

      case 'get_slide':
        result = await getSlide(args as any);
        break;

      case 'delete_slide':
        result = await deleteSlide(args as any);
        break;

      case 'reorder_slides':
        result = await reorderSlides(args as any);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr since stdout is used for MCP communication
  console.error('MCP Google Slides server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
