/**
 * create_shape tool implementation
 *
 * Creates a shape on a slide with optional fill color and text.
 */

import { z } from 'zod';
import { createSlidesClient } from '../../clients/index.js';
import { inchesToEmu } from '../../utils/emu.js';
import { parseColor } from '../../utils/colors.js';
import type { Position } from '../../types/common.js';

/**
 * Input schema for create_shape tool
 */
export const CreateShapeInputSchema = z.object({
  presentationId: z.string().describe('The presentation ID'),
  slideId: z.string().describe('The slide to add the shape to'),
  shapeType: z
    .enum([
      'RECTANGLE',
      'ROUND_RECTANGLE',
      'ELLIPSE',
      'TRIANGLE',
      'PARALLELOGRAM',
      'TRAPEZOID',
      'PENTAGON',
      'HEXAGON',
      'DIAMOND',
      'RIGHT_ARROW',
      'LEFT_ARROW',
      'UP_ARROW',
      'DOWN_ARROW',
      'LEFT_RIGHT_ARROW',
      'UP_DOWN_ARROW',
      'BENT_ARROW',
      'CURVED_RIGHT_ARROW',
      'STAR_4',
      'STAR_5',
      'STAR_6',
      'STAR_8',
      'RIBBON',
      'RIBBON_2',
      'CALLOUT_RECTANGLE',
      'CALLOUT_ROUND_RECTANGLE',
      'CALLOUT_ELLIPSE',
      'TEXT_BOX',
      'CLOUD',
      'HEART',
      'PLUS',
      'WAVE',
    ])
    .describe('The type of shape to create'),
  position: z
    .object({
      x: z.number().describe('Left edge in inches'),
      y: z.number().describe('Top edge in inches'),
      width: z.number().describe('Width in inches'),
      height: z.number().describe('Height in inches'),
    })
    .describe('Position and size for the shape'),
  fillColor: z
    .string()
    .optional()
    .describe("Fill color as hex (e.g., '#FF5733') or color name"),
  text: z.string().optional().describe('Optional text to place inside the shape'),
});

export type CreateShapeInput = z.infer<typeof CreateShapeInputSchema>;

/**
 * Output interface for create_shape tool
 */
export interface CreateShapeOutput {
  shapeId: string;
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
  return `shape_${timestamp}_${random}`;
}

/**
 * Create a shape on a slide
 *
 * @param input - Tool input containing presentation ID, slide ID, shape type, position, optional fill color and text
 * @returns Shape ID
 * @throws {AuthenticationError} If authentication fails
 * @throws {PresentationNotFoundError} If presentation not found
 * @throws {QuotaExceededError} If API quota is exceeded
 * @throws {ColorParseError} If fill color format is invalid
 */
export async function createShape(
  input: CreateShapeInput
): Promise<CreateShapeOutput> {
  // Validate input
  const validatedInput = CreateShapeInputSchema.parse(input);

  // Create authenticated Slides API client
  const client = await createSlidesClient();

  // Generate unique object ID for the shape
  const shapeId = generateObjectId();
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

  // Build the CreateShapeRequest
  const createShapeRequest: any = {
    createShape: {
      objectId: shapeId,
      shapeType: validatedInput.shapeType,
      elementProperties: {
        pageObjectId: validatedInput.slideId,
        size: sizeEmu,
        transform: transformEmu,
      },
    },
  };

  // Collect all requests to batch
  const requests: any[] = [createShapeRequest];

  // Add fill color if provided
  if (validatedInput.fillColor) {
    const rgbColor = parseColor(validatedInput.fillColor);

    const updateShapePropertiesRequest = {
      updateShapeProperties: {
        objectId: shapeId,
        fields: 'shapeBackgroundFill.solidFill.color',
        shapeProperties: {
          shapeBackgroundFill: {
            solidFill: {
              color: {
                rgbColor: rgbColor,
              },
            },
          },
        },
      },
    };

    requests.push(updateShapePropertiesRequest);
  }

  // Add text if provided
  if (validatedInput.text) {
    const insertTextRequest = {
      insertText: {
        objectId: shapeId,
        text: validatedInput.text,
        insertionIndex: 0,
      },
    };

    requests.push(insertTextRequest);
  }

  // Execute the batch update
  await client.batchUpdate(validatedInput.presentationId, requests);

  // Return the shape ID
  return {
    shapeId,
  };
}
