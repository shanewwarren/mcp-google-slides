/**
 * get_slide tool implementation
 *
 * Gets details about a specific slide in a presentation.
 */

import { z } from 'zod';
import { createSlidesClient } from '../../clients/index.js';

/**
 * Input schema for get_slide tool
 */
export const GetSlideInputSchema = z.object({
  presentationId: z.string().describe('The presentation ID'),
  slideId: z.string().describe('The slide ID'),
});

export type GetSlideInput = z.infer<typeof GetSlideInputSchema>;

/**
 * Output interface for get_slide tool
 */
export interface GetSlideOutput {
  objectId: string;
  index: number;
  elements: Array<{
    objectId: string;
    type: string;
    description?: string;
  }>;
}

/**
 * Get details about a specific slide
 *
 * @param input - Tool input containing presentation ID and slide ID
 * @returns Slide object ID, index, and elements
 * @throws {AuthenticationError} If authentication fails
 * @throws {PresentationNotFoundError} If presentation or slide not found
 * @throws {QuotaExceededError} If API quota is exceeded
 */
export async function getSlide(input: GetSlideInput): Promise<GetSlideOutput> {
  // Validate input
  const validatedInput = GetSlideInputSchema.parse(input);

  // Create authenticated Slides API client
  const client = await createSlidesClient();

  // Get the slide using the client's getSlide method
  const slide = await client.getSlide(validatedInput.presentationId, validatedInput.slideId);

  // Also get the full presentation to find the slide's index
  const presentation = await client.getPresentation(validatedInput.presentationId);
  const slideIndex =
    presentation.slides?.findIndex((s) => s.objectId === validatedInput.slideId) ?? -1;

  // Extract element information
  const elements: Array<{
    objectId: string;
    type: string;
    description?: string;
  }> = [];

  if (slide.pageElements) {
    for (const element of slide.pageElements) {
      // Determine element type
      let elementType = 'UNKNOWN';
      let description: string | undefined;

      if (element.shape) {
        elementType = 'SHAPE';
        // Add placeholder info if it's a placeholder
        if (element.shape.placeholder) {
          description = `Placeholder: ${element.shape.placeholder.type || 'UNKNOWN'}`;
        } else if (element.shape.shapeType) {
          description = `Shape type: ${element.shape.shapeType}`;
        }
        // Include text content if available (full text, no truncation)
        if (element.shape.text?.textElements) {
          const textContent = element.shape.text.textElements
            .map((te) => te.textRun?.content || '')
            .join('')
            .trim();
          if (textContent) {
            description = description
              ? `${description} - Text: "${textContent}"`
              : `Text: "${textContent}"`;
          }
        }
      } else if (element.image) {
        elementType = 'IMAGE';
        description = element.image.contentUrl ? 'Image from URL' : 'Uploaded image';
      } else if (element.table) {
        elementType = 'TABLE';
        const rows = element.table.rows || 0;
        const cols = element.table.columns || 0;
        description = `${rows} rows × ${cols} columns`;
      } else if (element.video) {
        elementType = 'VIDEO';
        description = element.video.source || 'Video';
      } else if (element.line) {
        elementType = 'LINE';
        description = element.line.lineType || 'Line';
      } else if (element.wordArt) {
        elementType = 'WORD_ART';
        description = 'WordArt';
      } else if (element.sheetsChart) {
        elementType = 'SHEETS_CHART';
        description = 'Embedded Google Sheets chart';
      }

      elements.push({
        objectId: element.objectId || '',
        type: elementType,
        ...(description && { description }),
      });
    }
  }

  // Return the result
  return {
    objectId: slide.objectId || validatedInput.slideId,
    index: slideIndex,
    elements,
  };
}
