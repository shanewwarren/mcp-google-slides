/**
 * insert_image tool implementation
 *
 * Inserts an image from a URL onto a slide.
 */

import { z } from 'zod';
import { createSlidesClient } from '../../clients/index.js';
import type { Position } from '../../types/common.js';
import { inchesToEmu } from '../../utils/emu.js';

/**
 * Input schema for insert_image tool
 */
export const InsertImageInputSchema = z.object({
  presentationId: z.string().describe('The presentation ID'),
  slideId: z.string().describe('The slide to add the image to'),
  imageUrl: z.string().url().describe('URL of the image to insert (must be publicly accessible)'),
  position: z
    .object({
      x: z.number().describe('Left edge in inches'),
      y: z.number().describe('Top edge in inches'),
      width: z.number().describe('Width in inches'),
      height: z.number().describe('Height in inches'),
    })
    .describe('Position and size for the image'),
  altText: z.string().optional().describe('Alt text for accessibility'),
});

export type InsertImageInput = z.infer<typeof InsertImageInputSchema>;

/**
 * Output interface for insert_image tool
 */
export interface InsertImageOutput {
  imageId: string;
  actualSize: {
    width: number;
    height: number;
  };
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
  return `image_${timestamp}_${random}`;
}

/**
 * Insert an image from a URL onto a slide
 *
 * @param input - Tool input containing presentation ID, slide ID, image URL, position, and optional alt text
 * @returns Image ID and actual size in inches
 * @throws {AuthenticationError} If authentication fails
 * @throws {PresentationNotFoundError} If presentation not found
 * @throws {QuotaExceededError} If API quota is exceeded
 * @throws {Error} If image URL is not accessible
 */
export async function insertImage(input: InsertImageInput): Promise<InsertImageOutput> {
  // Validate input
  const validatedInput = InsertImageInputSchema.parse(input);

  // Create authenticated Slides API client
  const client = await createSlidesClient();

  // Generate unique object ID for the image
  const imageId = generateObjectId();
  const position: Position = validatedInput.position;

  // Convert position from inches to EMU
  const sizeEmu = {
    width: { magnitude: inchesToEmu(position.width), unit: 'EMU' },
    height: { magnitude: inchesToEmu(position.height), unit: 'EMU' },
  };

  const transformEmu = {
    scaleX: 1,
    scaleY: 1,
    translateX: inchesToEmu(position.x),
    translateY: inchesToEmu(position.y),
    unit: 'EMU',
  };

  // Build the CreateImageRequest
  const request = {
    createImage: {
      objectId: imageId,
      url: validatedInput.imageUrl,
      elementProperties: {
        pageObjectId: validatedInput.slideId,
        size: sizeEmu,
        transform: transformEmu,
      },
    },
  };

  // Execute the batch update
  await client.batchUpdate(validatedInput.presentationId, [request]);

  // Return the result with the specified dimensions
  // Note: The API doesn't return the actual image dimensions, so we return what was requested
  return {
    imageId,
    actualSize: {
      width: position.width,
      height: position.height,
    },
  };
}
