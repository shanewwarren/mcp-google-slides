/**
 * insert_text tool implementation
 *
 * Inserts text into a placeholder or creates a new text box on a slide.
 */

import { z } from 'zod';
import { createSlidesClient } from '../../clients/index.js';
import type { Position } from '../../types/common.js';
import { inchesToEmu } from '../../utils/emu.js';

/**
 * Input schema for insert_text tool
 */
export const InsertTextInputSchema = z.object({
  presentationId: z.string().describe('The presentation ID'),
  slideId: z.string().describe('The slide to add text to'),
  text: z.string().describe('The text content to insert'),
  placeholderId: z
    .string()
    .optional()
    .describe('ID of an existing placeholder to fill. If omitted, creates a text box.'),
  position: z
    .object({
      x: z.number().describe('Left edge in inches'),
      y: z.number().describe('Top edge in inches'),
      width: z.number().describe('Width in inches'),
      height: z.number().describe('Height in inches'),
    })
    .optional()
    .describe('Position for new text box (ignored if placeholderId provided)'),
});

export type InsertTextInput = z.infer<typeof InsertTextInputSchema>;

/**
 * Output interface for insert_text tool
 */
export interface InsertTextOutput {
  objectId: string;
  insertedText: string;
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
  return `text_${timestamp}_${random}`;
}

/**
 * Insert text into a placeholder or create a text box
 *
 * @param input - Tool input containing presentation ID, slide ID, text, and optional placeholder ID or position
 * @returns Object ID and inserted text
 * @throws {AuthenticationError} If authentication fails
 * @throws {PresentationNotFoundError} If presentation not found
 * @throws {QuotaExceededError} If API quota is exceeded
 */
export async function insertText(input: InsertTextInput): Promise<InsertTextOutput> {
  // Validate input
  const validatedInput = InsertTextInputSchema.parse(input);

  // Create authenticated Slides API client
  const client = await createSlidesClient();

  // Determine the mode: placeholder or text box
  const isPlaceholderMode = !!validatedInput.placeholderId;

  // Build requests based on mode
  const requests: any[] = [];
  let objectId: string;

  if (isPlaceholderMode) {
    // Mode 1: Insert text into existing placeholder
    objectId = validatedInput.placeholderId!;

    requests.push({
      insertText: {
        objectId,
        text: validatedInput.text,
        insertionIndex: 0,
      },
    });
  } else {
    // Mode 2: Create a text box and insert text
    if (!validatedInput.position) {
      throw new Error('Position is required when placeholderId is not provided');
    }

    objectId = generateObjectId();
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

    // Create text box shape
    requests.push({
      createShape: {
        objectId,
        shapeType: 'TEXT_BOX',
        elementProperties: {
          pageObjectId: validatedInput.slideId,
          size: sizeEmu,
          transform: transformEmu,
        },
      },
    });

    // Insert text into the text box
    requests.push({
      insertText: {
        objectId,
        text: validatedInput.text,
        insertionIndex: 0,
      },
    });
  }

  // Execute the batch update
  await client.batchUpdate(validatedInput.presentationId, requests);

  // Return the result
  return {
    objectId,
    insertedText: validatedInput.text,
  };
}
