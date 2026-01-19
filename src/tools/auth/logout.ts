/**
 * logout tool implementation
 *
 * Clears stored OAuth tokens to enable re-authentication with a different Google account.
 */

import { z } from 'zod';
import { deleteTokens } from '../../auth/token-store.js';

/**
 * Input schema for logout tool (no parameters required)
 */
export const LogoutInputSchema = z.object({});

export type LogoutInput = z.infer<typeof LogoutInputSchema>;

/**
 * Output interface for logout tool
 */
export interface LogoutOutput {
  success: true;
  message: string;
}

/**
 * Clear stored Google OAuth credentials
 *
 * Use this to switch to a different Google account. The next tool call
 * will trigger a new authentication flow.
 *
 * @param _input - Tool input (unused, no parameters required)
 * @returns Success confirmation with message
 * @throws {Error} If token file deletion fails (except for file not found)
 */
export async function logout(_input: LogoutInput): Promise<LogoutOutput> {
  // Validate input (no-op since schema is empty, but maintains consistency)
  LogoutInputSchema.parse(_input);

  // Delete stored tokens
  await deleteTokens();

  return {
    success: true,
    message:
      'Logged out successfully. Your stored credentials have been cleared. The next tool call will prompt you to authenticate with Google.',
  };
}
