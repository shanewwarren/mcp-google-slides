/**
 * format_paragraph tool implementation
 *
 * Applies paragraph-level formatting to text within a shape or text box.
 */

import { z } from 'zod';
import { createSlidesClient } from '../../clients/index.js';

/**
 * Text range schema for paragraph formatting
 */
const TextRangeSchema = z.object({
  startIndex: z.number().int().min(0).describe('Start index (0-based)'),
  endIndex: z.number().int().min(0).optional().describe('End index (exclusive). Omit for "to end"'),
});

/**
 * Paragraph alignment enum
 */
const ParagraphAlignmentSchema = z.enum(['START', 'CENTER', 'END', 'JUSTIFIED']);

/**
 * Paragraph style schema
 */
const ParagraphStyleSchema = z.object({
  alignment: ParagraphAlignmentSchema.optional().describe('Text alignment'),
  lineSpacing: z.number().positive().optional().describe('Line spacing percentage (100 = single, 150 = 1.5x)'),
  spaceBefore: z.number().min(0).optional().describe('Space before paragraph in points'),
  spaceAfter: z.number().min(0).optional().describe('Space after paragraph in points'),
  indentStart: z.number().min(0).optional().describe('Left indent in points'),
  indentFirstLine: z.number().optional().describe('First line indent in points (can be negative for hanging indent)'),
});

/**
 * Input schema for format_paragraph tool
 */
export const FormatParagraphInputSchema = z.object({
  presentationId: z.string().describe('The presentation ID'),
  objectId: z.string().describe('ID of the shape/text box'),
  style: ParagraphStyleSchema.describe('Paragraph style to apply'),
  range: TextRangeSchema.optional().describe('Range to format. Omit to format all paragraphs.'),
});

export type FormatParagraphInput = z.infer<typeof FormatParagraphInputSchema>;

/**
 * Output interface for format_paragraph tool
 */
export interface FormatParagraphOutput {
  formatted: true;
  objectId: string;
  paragraphCount: number;
}

/**
 * Generate field mask from style object
 *
 * The Google Slides API requires a field mask specifying which style properties to update.
 * Only properties present in the style object should be included in the mask.
 *
 * @param style - The paragraph style object
 * @returns A comma-separated field mask string
 */
function generateFieldMask(style: z.infer<typeof ParagraphStyleSchema>): string {
  const fields: string[] = [];

  if (style.alignment !== undefined) fields.push('alignment');
  if (style.lineSpacing !== undefined) fields.push('lineSpacing');
  if (style.spaceBefore !== undefined) fields.push('spaceAbove');
  if (style.spaceAfter !== undefined) fields.push('spaceBelow');
  if (style.indentStart !== undefined) fields.push('indentStart');
  if (style.indentFirstLine !== undefined) fields.push('indentFirstLine');

  if (fields.length === 0) {
    throw new Error('At least one style property must be specified');
  }

  return fields.join(',');
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
 * Build paragraph style object for the API request
 *
 * @param style - The paragraph style to apply
 * @returns API-compatible style object
 */
function buildStyleObject(style: z.infer<typeof ParagraphStyleSchema>): any {
  const apiStyle: any = {};

  if (style.alignment !== undefined) {
    apiStyle.alignment = style.alignment;
  }

  if (style.lineSpacing !== undefined) {
    apiStyle.lineSpacing = style.lineSpacing;
  }

  if (style.spaceBefore !== undefined) {
    apiStyle.spaceAbove = {
      magnitude: style.spaceBefore,
      unit: 'PT',
    };
  }

  if (style.spaceAfter !== undefined) {
    apiStyle.spaceBelow = {
      magnitude: style.spaceAfter,
      unit: 'PT',
    };
  }

  if (style.indentStart !== undefined) {
    apiStyle.indentStart = {
      magnitude: style.indentStart,
      unit: 'PT',
    };
  }

  if (style.indentFirstLine !== undefined) {
    apiStyle.indentFirstLine = {
      magnitude: style.indentFirstLine,
      unit: 'PT',
    };
  }

  return apiStyle;
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
 * Apply paragraph-level formatting to text
 *
 * @param input - Tool input containing presentation ID, object ID, style, and optional range
 * @returns Formatting result
 * @throws {AuthenticationError} If authentication fails
 * @throws {PresentationNotFoundError} If presentation not found
 * @throws {QuotaExceededError} If API quota is exceeded
 */
export async function formatParagraph(
  input: FormatParagraphInput
): Promise<FormatParagraphOutput> {
  // Validate input
  const validatedInput = FormatParagraphInputSchema.parse(input);

  // Create authenticated Slides API client
  const client = await createSlidesClient();

  // Generate field mask
  const fields = generateFieldMask(validatedInput.style);

  // Build text range
  const textRange = buildTextRange(validatedInput.range);

  // Build style object
  const style = buildStyleObject(validatedInput.style);

  // Build the UpdateParagraphStyleRequest
  const request = {
    updateParagraphStyle: {
      objectId: validatedInput.objectId,
      textRange,
      style,
      fields,
    },
  };

  // Execute the batch update
  await client.batchUpdate(validatedInput.presentationId, [request]);

  // Estimate paragraph count for output
  const paragraphCount = estimateParagraphCount();

  // Return the result
  return {
    formatted: true,
    objectId: validatedInput.objectId,
    paragraphCount,
  };
}
