/**
 * duplicate_presentation tool implementation
 *
 * Duplicates an existing presentation to create a new copy.
 * Preserves all styling, layouts, masters, and content.
 */

import { z } from 'zod';
import { createDriveClient } from '../../clients/index.js';

/**
 * Input schema for duplicate_presentation tool
 */
export const DuplicatePresentationInputSchema = z.object({
  presentationId: z.string().describe('The ID of the presentation to duplicate'),
  title: z.string().describe('The title for the new presentation'),
});

export type DuplicatePresentationInput = z.infer<typeof DuplicatePresentationInputSchema>;

/**
 * Output interface for duplicate_presentation tool
 */
export interface DuplicatePresentationOutput {
  presentationId: string;
  title: string;
  link: string;
}

/**
 * Duplicate an existing presentation
 *
 * Creates a complete copy of the presentation including all slides,
 * styling, masters, layouts, and content.
 *
 * @param input - Tool input containing source presentation ID and new title
 * @returns New presentation ID, title, and link
 * @throws {AuthenticationError} If authentication fails
 * @throws {PermissionDeniedError} If no access to the source presentation
 * @throws {QuotaExceededError} If API quota is exceeded
 */
export async function duplicatePresentation(
  input: DuplicatePresentationInput
): Promise<DuplicatePresentationOutput> {
  // Validate input
  const validatedInput = DuplicatePresentationInputSchema.parse(input);

  // Create authenticated Drive API client
  const client = await createDriveClient();

  // Copy the presentation
  const result = await client.copyPresentation(validatedInput.presentationId, validatedInput.title);

  return {
    presentationId: result.presentationId,
    title: result.title,
    link: result.link,
  };
}
