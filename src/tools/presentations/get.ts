/**
 * get_presentation tool implementation
 *
 * Retrieves full details of a Google Slides presentation including all slides.
 */

import { z } from 'zod';
import { createSlidesClient } from '../../clients/index.js';

/**
 * Input schema for get_presentation tool
 */
export const GetPresentationInputSchema = z.object({
  presentationId: z.string().describe('The ID of the presentation to retrieve'),
});

export type GetPresentationInput = z.infer<typeof GetPresentationInputSchema>;

/**
 * Output interface for get_presentation tool
 */
export interface GetPresentationOutput {
  presentationId: string;
  title: string;
  slideCount: number;
  slides: Array<{
    objectId: string;
    pageType: string;
    elements: number;
  }>;
  link: string;
}

/**
 * Get details of a Google Slides presentation
 *
 * @param input - Tool input containing presentation ID
 * @returns Presentation details including slides
 * @throws {AuthenticationError} If authentication fails
 * @throws {PresentationNotFoundError} If presentation not found
 * @throws {PermissionDeniedError} If no access to presentation
 * @throws {QuotaExceededError} If API quota is exceeded
 */
export async function getPresentation(input: GetPresentationInput): Promise<GetPresentationOutput> {
  // Validate input
  const validatedInput = GetPresentationInputSchema.parse(input);

  // Create authenticated Slides API client
  const client = await createSlidesClient();

  // Get the presentation
  const presentation = await client.getPresentation(validatedInput.presentationId);

  if (!presentation.presentationId) {
    throw new Error('No presentation ID in API response');
  }

  // Process slides data
  const slides = (presentation.slides || []).map((slide) => ({
    objectId: slide.objectId || '',
    pageType: slide.pageType || 'SLIDE',
    elements: (slide.pageElements || []).length,
  }));

  // Build the output
  return {
    presentationId: presentation.presentationId,
    title: presentation.title || 'Untitled presentation',
    slideCount: slides.length,
    slides,
    link: `https://docs.google.com/presentation/d/${presentation.presentationId}/edit`,
  };
}
