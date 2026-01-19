/**
 * Authentication management tools
 *
 * MCP tools for managing OAuth credentials.
 */

import { type LogoutInput, LogoutInputSchema, type LogoutOutput, logout } from './logout.js';

/**
 * Export all auth tool implementations
 */
export { logout };

/**
 * Export all auth tool types
 */
export type { LogoutInput, LogoutOutput };

/**
 * Export all auth tool schemas
 */
export { LogoutInputSchema };

/**
 * MCP tool definitions for authentication management
 */
export const authTools = [
  {
    name: 'logout',
    description:
      'Clear stored Google OAuth credentials. Use this to switch to a different Google account. The next tool call will trigger a new authentication flow.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
] as const;
