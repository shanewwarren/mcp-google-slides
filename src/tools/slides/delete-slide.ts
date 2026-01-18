/**
 * delete_slide tool implementation
 *
 * Removes a slide from a presentation.
 */

import { z } from 'zod';
import { createSlidesClient } from '../../clients/index.js';

/**
 * Input schema for delete_slide tool
 */
export const DeleteSlideInputSchema = z.object({
  presentationId: z.string().describe('The presentation ID'),
  slideId: z.string().describe('The ID of the slide to delete'),
});

export type DeleteSlideInput = z.infer<typeof DeleteSlideInputSchema>;

/**
 * Output interface for delete_slide tool
 */
export interface DeleteSlideOutput {
  deleted: true;
  remainingSlides: number;
}

/**
 * Delete a slide from a presentation
 *
 * @param input - Tool input containing presentation ID and slide ID
 * @returns Confirmation of deletion and count of remaining slides
 * @throws {AuthenticationError} If authentication fails
 * @throws {PresentationNotFoundError} If presentation not found
 * @throws {QuotaExceededError} If API quota is exceeded
 * @throws {Error} If attempting to delete the only slide in the presentation
 */
export async function deleteSlide(input: DeleteSlideInput): Promise<DeleteSlideOutput> {
  // Validate input
  const validatedInput = DeleteSlideInputSchema.parse(input);

  // Create authenticated Slides API client
  const client = await createSlidesClient();

  // Get the presentation first to check if this is the only slide
  const presentation = await client.getPresentation(validatedInput.presentationId);
  const slideCount = presentation.slides?.length ?? 0;

  if (slideCount <= 1) {
    throw new Error('Cannot delete the only slide in the presentation');
  }

  // Verify the slide exists in the presentation
  const slideExists = presentation.slides?.some(
    (slide) => slide.objectId === validatedInput.slideId
  );

  if (!slideExists) {
    throw new Error(`Slide not found: ${validatedInput.slideId}`);
  }

  // Build the DeleteObjectRequest
  const requests = [
    {
      deleteObject: {
        objectId: validatedInput.slideId,
      },
    },
  ];

  // Execute the batch update
  await client.batchUpdate(validatedInput.presentationId, requests);

  // Return the result
  return {
    deleted: true,
    remainingSlides: slideCount - 1,
  };
}
