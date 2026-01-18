/**
 * add_slide tool implementation
 *
 * Adds a new slide to a presentation with the specified layout.
 */

import { z } from 'zod';
import { createSlidesClient } from '../../clients/index.js';

/**
 * Input schema for add_slide tool
 */
export const AddSlideInputSchema = z.object({
  presentationId: z.string().describe('The presentation to add a slide to'),
  layout: z
    .enum([
      'BLANK',
      'TITLE',
      'TITLE_AND_BODY',
      'TITLE_AND_TWO_COLUMNS',
      'TITLE_ONLY',
      'SECTION_HEADER',
      'SECTION_TITLE_AND_DESCRIPTION',
      'ONE_COLUMN_TEXT',
      'MAIN_POINT',
      'BIG_NUMBER',
      'CAPTION_ONLY',
    ])
    .optional()
    .default('TITLE_AND_BODY')
    .describe('The predefined layout to use'),
  insertionIndex: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe('Position to insert the slide (0-based). Omit to add at end.'),
});

export type AddSlideInput = z.infer<typeof AddSlideInputSchema>;

/**
 * Output interface for add_slide tool
 */
export interface AddSlideOutput {
  slideId: string;
  index: number;
  placeholders: Array<{
    objectId: string;
    type: string;
  }>;
}

/**
 * Generate a valid object ID for Google Slides API
 *
 * Object IDs must be 5-50 characters and start with alphanumeric or underscore.
 *
 * @returns A unique object ID
 */
function generateObjectId(): string {
  // Use timestamp and random string to ensure uniqueness
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `slide_${timestamp}_${random}`;
}

/**
 * Add a new slide to a presentation
 *
 * @param input - Tool input containing presentation ID, layout, and optional insertion index
 * @returns Slide ID, index, and placeholders
 * @throws {AuthenticationError} If authentication fails
 * @throws {PresentationNotFoundError} If presentation not found
 * @throws {QuotaExceededError} If API quota is exceeded
 */
export async function addSlide(input: AddSlideInput): Promise<AddSlideOutput> {
  // Validate input
  const validatedInput = AddSlideInputSchema.parse(input);

  // Create authenticated Slides API client
  const client = await createSlidesClient();

  // Generate a unique object ID for the slide
  const slideId = generateObjectId();

  // Build the CreateSlideRequest
  const requests = [
    {
      createSlide: {
        objectId: slideId,
        insertionIndex: validatedInput.insertionIndex,
        slideLayoutReference: {
          predefinedLayout: validatedInput.layout,
        },
      },
    },
  ];

  // Execute the batch update
  const response = await client.batchUpdate(validatedInput.presentationId, requests);

  // Extract the CreateSlideResponse from the replies
  const createSlideReply = response.replies?.[0]?.createSlide;
  if (!createSlideReply) {
    throw new Error('No createSlide reply received from API');
  }

  // Extract placeholder information
  const placeholders: Array<{ objectId: string; type: string }> = [];

  // Get the full presentation to find the slide details and placeholders
  const presentation = await client.getPresentation(validatedInput.presentationId);
  const slide = presentation.slides?.find((s) => s.objectId === slideId);

  if (slide?.pageElements) {
    for (const element of slide.pageElements) {
      // Check if this element is a shape with a placeholder
      if (element.shape?.placeholder) {
        const placeholder = element.shape.placeholder;
        placeholders.push({
          objectId: element.objectId || '',
          type: placeholder.type || 'UNKNOWN',
        });
      }
    }
  }

  // Return the result
  return {
    slideId,
    index: createSlideReply.objectId ?
      (presentation.slides?.findIndex(s => s.objectId === slideId) ?? -1) :
      -1,
    placeholders,
  };
}
