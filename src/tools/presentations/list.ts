/**
 * list_presentations tool implementation
 *
 * Lists Google Slides presentations created by this application.
 */

import { z } from 'zod';
import { createDriveClient, type PresentationSummary } from '../../clients/index.js';

/**
 * Input schema for list_presentations tool
 */
export const ListPresentationsInputSchema = z.object({
  limit: z
    .number()
    .int()
    .positive()
    .default(10)
    .describe('Maximum number of presentations to return'),
});

export type ListPresentationsInput = z.infer<typeof ListPresentationsInputSchema>;

/**
 * Output interface for list_presentations tool
 */
export interface ListPresentationsOutput {
  presentations: PresentationSummary[];
  totalCount: number;
}

/**
 * List Google Slides presentations created by this app
 *
 * Note: With drive.file scope, only presentations created by this application are returned.
 *
 * @param input - Tool input with optional limit
 * @returns List of presentation summaries
 * @throws {AuthenticationError} If authentication fails
 * @throws {QuotaExceededError} If API quota is exceeded
 */
export async function listPresentations(
  input: ListPresentationsInput = { limit: 10 }
): Promise<ListPresentationsOutput> {
  // Validate input
  const validatedInput = ListPresentationsInputSchema.parse(input);

  // Create authenticated Drive API client
  const client = await createDriveClient();

  // List presentations
  const presentations = await client.listPresentations(validatedInput.limit);

  // Build the output
  return {
    presentations,
    totalCount: presentations.length,
  };
}
