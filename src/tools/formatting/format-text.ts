/**
 * format_text tool implementation
 *
 * Applies character-level formatting to text within a shape or text box.
 */

import { z } from 'zod';
import { createSlidesClient } from '../../clients/index.js';
import { parseColor } from '../../utils/colors.js';

/**
 * Text range schema
 */
const TextRangeSchema = z.object({
  startIndex: z.number().int().min(0).describe('Start index (0-based)'),
  endIndex: z.number().int().min(0).optional().describe('End index (exclusive). Omit for "to end"'),
});

/**
 * Text style schema
 */
const TextStyleSchema = z.object({
  fontFamily: z.string().optional().describe('Font name (e.g., "Arial", "Roboto")'),
  fontSize: z.number().positive().optional().describe('Font size in points'),
  bold: z.boolean().optional().describe('Bold weight'),
  italic: z.boolean().optional().describe('Italic style'),
  underline: z.boolean().optional().describe('Underline decoration'),
  strikethrough: z.boolean().optional().describe('Strikethrough decoration'),
  foregroundColor: z.string().optional().describe('Text color (hex, RGB, or named)'),
  backgroundColor: z.string().optional().describe('Highlight color (hex, RGB, or named)'),
  link: z.string().url().optional().describe('URL to create a hyperlink'),
});

/**
 * Input schema for format_text tool
 */
export const FormatTextInputSchema = z.object({
  presentationId: z.string().describe('The presentation ID'),
  objectId: z.string().describe('ID of the shape/text box containing the text'),
  style: TextStyleSchema.describe('Text style to apply'),
  range: TextRangeSchema.optional().describe('Text range to format. Omit to format all text.'),
});

export type FormatTextInput = z.infer<typeof FormatTextInputSchema>;

/**
 * Output interface for format_text tool
 */
export interface FormatTextOutput {
  formatted: true;
  objectId: string;
  styledCharacters: number;
}

/**
 * Generate field mask from style object
 *
 * The Google Slides API requires a field mask specifying which style properties to update.
 * Only properties present in the style object should be included in the mask.
 *
 * @param style - The text style object
 * @returns A comma-separated field mask string
 */
function generateFieldMask(style: z.infer<typeof TextStyleSchema>): string {
  const fields: string[] = [];

  if (style.fontFamily !== undefined) fields.push('fontFamily');
  if (style.fontSize !== undefined) fields.push('fontSize');
  if (style.bold !== undefined) fields.push('bold');
  if (style.italic !== undefined) fields.push('italic');
  if (style.underline !== undefined) fields.push('underline');
  if (style.strikethrough !== undefined) fields.push('strikethrough');
  if (style.foregroundColor !== undefined) fields.push('foregroundColor');
  if (style.backgroundColor !== undefined) fields.push('backgroundColor');
  if (style.link !== undefined) fields.push('link');

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
 * Build style object for the API request
 *
 * @param style - The text style to apply
 * @returns API-compatible style object
 */
function buildStyleObject(style: z.infer<typeof TextStyleSchema>): any {
  const apiStyle: any = {};

  if (style.fontFamily !== undefined) {
    apiStyle.fontFamily = style.fontFamily;
  }

  if (style.fontSize !== undefined) {
    apiStyle.fontSize = {
      magnitude: style.fontSize,
      unit: 'PT',
    };
  }

  if (style.bold !== undefined) {
    apiStyle.bold = style.bold;
  }

  if (style.italic !== undefined) {
    apiStyle.italic = style.italic;
  }

  if (style.underline !== undefined) {
    apiStyle.underline = style.underline;
  }

  if (style.strikethrough !== undefined) {
    apiStyle.strikethrough = style.strikethrough;
  }

  if (style.foregroundColor !== undefined) {
    const color = parseColor(style.foregroundColor);
    apiStyle.foregroundColor = {
      opaqueColor: {
        rgbColor: color,
      },
    };
  }

  if (style.backgroundColor !== undefined) {
    const color = parseColor(style.backgroundColor);
    apiStyle.backgroundColor = {
      opaqueColor: {
        rgbColor: color,
      },
    };
  }

  if (style.link !== undefined) {
    apiStyle.link = {
      url: style.link,
    };
  }

  return apiStyle;
}

/**
 * Calculate character count from range
 *
 * For reporting purposes, we estimate the number of characters styled.
 * Without fetching the element, we can't know the exact count for ALL or FROM_START_INDEX ranges.
 *
 * @param range - The text range
 * @returns Estimated character count, or -1 if unknown
 */
function estimateCharacterCount(range?: z.infer<typeof TextRangeSchema>): number {
  if (!range) {
    return -1; // ALL - unknown without fetching
  }

  if (range.endIndex === undefined) {
    return -1; // FROM_START_INDEX - unknown without fetching
  }

  return range.endIndex - range.startIndex;
}

/**
 * Apply character-level formatting to text
 *
 * @param input - Tool input containing presentation ID, object ID, style, and optional range
 * @returns Formatting result
 * @throws {AuthenticationError} If authentication fails
 * @throws {PresentationNotFoundError} If presentation not found
 * @throws {QuotaExceededError} If API quota is exceeded
 */
export async function formatText(
  input: FormatTextInput
): Promise<FormatTextOutput> {
  // Validate input
  const validatedInput = FormatTextInputSchema.parse(input);

  // Create authenticated Slides API client
  const client = await createSlidesClient();

  // Generate field mask
  const fields = generateFieldMask(validatedInput.style);

  // Build text range
  const textRange = buildTextRange(validatedInput.range);

  // Build style object
  const style = buildStyleObject(validatedInput.style);

  // Build the UpdateTextStyleRequest
  const request = {
    updateTextStyle: {
      objectId: validatedInput.objectId,
      textRange,
      style,
      fields,
    },
  };

  // Execute the batch update
  await client.batchUpdate(validatedInput.presentationId, [request]);

  // Estimate character count for output
  const charCount = estimateCharacterCount(validatedInput.range);

  // Return the result
  return {
    formatted: true,
    objectId: validatedInput.objectId,
    styledCharacters: charCount,
  };
}
