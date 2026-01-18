/**
 * reorder_slides tool implementation
 *
 * Changes the order of slides in a presentation.
 */

import { z } from 'zod';
import { createSlidesClient } from '../../clients/index.js';

/**
 * Input schema for reorder_slides tool
 */
export const ReorderSlidesInputSchema = z.object({
  presentationId: z.string().describe('The presentation ID'),
  slideIds: z.array(z.string()).min(1).describe('Slide IDs in their new order'),
  insertionIndex: z.number().int().nonnegative().describe('New starting position for the slides'),
});

export type ReorderSlidesInput = z.infer<typeof ReorderSlidesInputSchema>;

/**
 * Output interface for reorder_slides tool
 */
export interface ReorderSlidesOutput {
  reordered: true;
}

/**
 * Reorder slides in a presentation
 *
 * @param input - Tool input containing presentation ID, slide IDs, and insertion index
 * @returns Confirmation of reordering
 * @throws {AuthenticationError} If authentication fails
 * @throws {PresentationNotFoundError} If presentation not found
 * @throws {QuotaExceededError} If API quota is exceeded
 * @throws {Error} If any slide ID is invalid or index is out of range
 */
export async function reorderSlides(input: ReorderSlidesInput): Promise<ReorderSlidesOutput> {
  // Validate input
  const validatedInput = ReorderSlidesInputSchema.parse(input);

  // Create authenticated Slides API client
  const client = await createSlidesClient();

  // Get the presentation to validate slide IDs and index
  const presentation = await client.getPresentation(validatedInput.presentationId);
  const slideCount = presentation.slides?.length ?? 0;

  // Validate insertion index
  if (validatedInput.insertionIndex > slideCount) {
    throw new Error(
      `Invalid insertion index: ${validatedInput.insertionIndex}. Presentation has ${slideCount} slides.`
    );
  }

  // Validate all slide IDs exist in the presentation
  const presentationSlideIds = new Set(presentation.slides?.map((slide) => slide.objectId) ?? []);

  for (const slideId of validatedInput.slideIds) {
    if (!presentationSlideIds.has(slideId)) {
      throw new Error(`Slide not found: ${slideId}`);
    }
  }

  // Build the UpdateSlidesPositionRequest
  const requests = [
    {
      updateSlidesPosition: {
        slideObjectIds: validatedInput.slideIds,
        insertionIndex: validatedInput.insertionIndex,
      },
    },
  ];

  // Execute the batch update
  await client.batchUpdate(validatedInput.presentationId, requests);

  // Return the result
  return {
    reordered: true,
  };
}
