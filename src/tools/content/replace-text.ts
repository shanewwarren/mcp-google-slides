/**
 * replace_text tool implementation
 *
 * Replaces all text in an existing text box or shape with new text.
 * Uses DeleteTextRequest to clear existing content, then InsertTextRequest to add new text.
 */

import { z } from 'zod';
import { createSlidesClient } from '../../clients/index.js';

/**
 * Input schema for replace_text tool
 */
export const ReplaceTextInputSchema = z.object({
  presentationId: z.string().describe('The presentation ID'),
  objectId: z.string().describe('The ID of the text box or shape containing text to replace'),
  text: z.string().describe('The new text content to set'),
});

export type ReplaceTextInput = z.infer<typeof ReplaceTextInputSchema>;

/**
 * Output interface for replace_text tool
 */
export interface ReplaceTextOutput {
  objectId: string;
  replacedText: string;
}

/**
 * Replace all text in an existing text box or shape
 *
 * @param input - Tool input containing presentation ID, object ID, and new text
 * @returns Object ID and the new text
 * @throws {AuthenticationError} If authentication fails
 * @throws {PresentationNotFoundError} If presentation not found
 * @throws {QuotaExceededError} If API quota is exceeded
 */
export async function replaceText(input: ReplaceTextInput): Promise<ReplaceTextOutput> {
  // Validate input
  const validatedInput = ReplaceTextInputSchema.parse(input);

  // Create authenticated Slides API client
  const client = await createSlidesClient();

  // Build requests: first delete all existing text, then insert new text
  const requests: any[] = [
    // Delete all existing text
    {
      deleteText: {
        objectId: validatedInput.objectId,
        textRange: {
          type: 'ALL',
        },
      },
    },
    // Insert new text
    {
      insertText: {
        objectId: validatedInput.objectId,
        text: validatedInput.text,
        insertionIndex: 0,
      },
    },
  ];

  // Execute the batch update
  await client.batchUpdate(validatedInput.presentationId, requests);

  // Return the result
  return {
    objectId: validatedInput.objectId,
    replacedText: validatedInput.text,
  };
}
