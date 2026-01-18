/**
 * create_presentation tool implementation
 *
 * Creates a new Google Slides presentation with the specified title.
 */

import { z } from 'zod';
import { createSlidesClient } from '../../clients/index.js';

/**
 * Input schema for create_presentation tool
 */
export const CreatePresentationInputSchema = z.object({
  title: z.string().describe('Title for the new presentation'),
});

export type CreatePresentationInput = z.infer<typeof CreatePresentationInputSchema>;

/**
 * Output interface for create_presentation tool
 */
export interface CreatePresentationOutput {
  presentationId: string;
  title: string;
  link: string;
}

/**
 * Create a new Google Slides presentation
 *
 * @param input - Tool input containing presentation title
 * @returns Presentation ID, title, and edit link
 * @throws {AuthenticationError} If authentication fails
 * @throws {QuotaExceededError} If API quota is exceeded
 */
export async function createPresentation(
  input: CreatePresentationInput
): Promise<CreatePresentationOutput> {
  // Validate input
  const validatedInput = CreatePresentationInputSchema.parse(input);

  // Create authenticated Slides API client
  const client = await createSlidesClient();

  // Create the presentation
  const presentation = await client.createPresentation(validatedInput.title);

  if (!presentation.presentationId) {
    throw new Error('No presentation ID returned from API');
  }

  // Build the output
  return {
    presentationId: presentation.presentationId,
    title: presentation.title || validatedInput.title,
    link: `https://docs.google.com/presentation/d/${presentation.presentationId}/edit`,
  };
}
