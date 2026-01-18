/**
 * create_bullets tool implementation
 *
 * Converts text paragraphs into bulleted or numbered lists.
 */

import { z } from 'zod';
import { createSlidesClient } from '../../clients/index.js';

/**
 * Text range schema for bullet creation
 */
const TextRangeSchema = z.object({
  startIndex: z.number().int().min(0).describe('Start index (0-based)'),
  endIndex: z.number().int().min(0).optional().describe('End index (exclusive). Omit for "to end"'),
});

/**
 * Bullet preset enum schema
 *
 * Each preset defines bullet/number styles for multiple nesting levels.
 */
const BulletPresetSchema = z.enum([
  // Bullet styles
  'BULLET_DISC_CIRCLE_SQUARE', // •, ◦, ▪ (default bullet)
  'BULLET_DIAMONDX_ARROW3D_SQUARE', // ◇, ➢, ▪
  'BULLET_CHECKBOX', // ☐
  'BULLET_ARROW_DIAMOND_DISC', // ➤, ◆, •
  'BULLET_STAR_CIRCLE_SQUARE', // ★, ○, ▪
  'BULLET_ARROW3D_CIRCLE_SQUARE', // ➢, ○, ▪
  // Numbered styles
  'NUMBERED_DIGIT_ALPHA_ROMAN', // 1, a, i (default numbered)
  'NUMBERED_DIGIT_ALPHA_ROMAN_PARENS', // 1), a), i)
  'NUMBERED_DIGIT_NESTED', // 1., 1.1., 1.1.1.
  'NUMBERED_UPPERALPHA_ALPHA_ROMAN', // A, a, i
  'NUMBERED_UPPERROMAN_UPPERALPHA_DIGIT', // I, A, 1
]);

/**
 * Input schema for create_bullets tool
 */
export const CreateBulletsInputSchema = z.object({
  presentationId: z.string().describe('The presentation ID'),
  objectId: z.string().describe('ID of the shape/text box'),
  bulletPreset: BulletPresetSchema.optional()
    .default('BULLET_DISC_CIRCLE_SQUARE')
    .describe('Preset bullet/number style (determines appearance at all nesting levels)'),
  range: TextRangeSchema.optional().describe('Range to apply bullets to. Omit for all text.'),
});

export type CreateBulletsInput = z.infer<typeof CreateBulletsInputSchema>;

/**
 * Output interface for create_bullets tool
 */
export interface CreateBulletsOutput {
  applied: true;
  objectId: string;
  paragraphCount: number;
}

/**
 * Build text range object for the API request
 *
 * @param range - Optional range specification
 * @returns API-compatible text range object
 */
function buildTextRange(range?: z.infer<typeof TextRangeSchema>): any {
  if (!range) {
    return { type: 'ALL' };
  }

  if (range.endIndex === undefined) {
    return {
      type: 'FROM_START_INDEX',
      startIndex: range.startIndex,
    };
  }

  return {
    type: 'FIXED_RANGE',
    startIndex: range.startIndex,
    endIndex: range.endIndex,
  };
}

/**
 * Estimate paragraph count from range
 *
 * For reporting purposes, we estimate the number of paragraphs formatted.
 * Without fetching the element, we can't know the exact count for ALL or FROM_START_INDEX ranges.
 *
 * @returns Estimated paragraph count, or -1 if unknown
 */
function estimateParagraphCount(): number {
  // We can't determine paragraph count without fetching the element
  // Return -1 to indicate "unknown" - the caller can decide how to report this
  return -1;
}

/**
 * Create bulleted or numbered list from text paragraphs
 *
 * @param input - Tool input containing presentation ID, object ID, preset, and optional range
 * @returns Bullet creation result
 * @throws {AuthenticationError} If authentication fails
 * @throws {PresentationNotFoundError} If presentation not found
 * @throws {QuotaExceededError} If API quota is exceeded
 */
export async function createBullets(input: CreateBulletsInput): Promise<CreateBulletsOutput> {
  // Validate input
  const validatedInput = CreateBulletsInputSchema.parse(input);

  // Create authenticated Slides API client
  const client = await createSlidesClient();

  // Build text range
  const textRange = buildTextRange(validatedInput.range);

  // Build the CreateParagraphBulletsRequest
  const request = {
    createParagraphBullets: {
      objectId: validatedInput.objectId,
      textRange,
      bulletPreset: validatedInput.bulletPreset,
    },
  };

  // Execute the batch update
  await client.batchUpdate(validatedInput.presentationId, [request]);

  // Estimate paragraph count for output
  const paragraphCount = estimateParagraphCount();

  // Return the result
  return {
    applied: true,
    objectId: validatedInput.objectId,
    paragraphCount,
  };
}
