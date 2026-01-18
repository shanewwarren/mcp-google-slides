/**
 * set_speaker_notes tool implementation
 *
 * Adds or updates speaker notes for a slide.
 */

import { z } from 'zod';
import { createSlidesClient } from '../../clients/index.js';

/**
 * Input schema for set_speaker_notes tool
 */
export const SetSpeakerNotesInputSchema = z.object({
  presentationId: z.string().describe('The presentation ID'),
  slideId: z.string().describe('The slide to add notes to'),
  notes: z.string().describe('The speaker notes content (plain text or simple formatting)'),
});

export type SetSpeakerNotesInput = z.infer<typeof SetSpeakerNotesInputSchema>;

/**
 * Output interface for set_speaker_notes tool
 */
export interface SetSpeakerNotesOutput {
  updated: true;
  notesLength: number;
}

/**
 * Error thrown when speaker notes shape is not found
 */
export class SpeakerNotesNotFoundError extends Error {
  constructor(slideId: string) {
    super(`Speaker notes shape not found for slide: ${slideId}`);
    this.name = 'SpeakerNotesNotFoundError';
  }
}

/**
 * Set speaker notes for a slide
 *
 * Replaces existing speaker notes with new content.
 *
 * @param input - Tool input containing presentation ID, slide ID, and notes text
 * @returns Confirmation of update and notes length
 * @throws {AuthenticationError} If authentication fails
 * @throws {PresentationNotFoundError} If presentation not found
 * @throws {SpeakerNotesNotFoundError} If speaker notes shape not found
 * @throws {QuotaExceededError} If API quota is exceeded
 */
export async function setSpeakerNotes(input: SetSpeakerNotesInput): Promise<SetSpeakerNotesOutput> {
  // Validate input
  const validatedInput = SetSpeakerNotesInputSchema.parse(input);

  // Create authenticated Slides API client
  const client = await createSlidesClient();

  // Get the slide to find the speaker notes object ID
  const slide = await client.getSlide(validatedInput.presentationId, validatedInput.slideId);

  // Extract speaker notes object ID
  const speakerNotesObjectId =
    slide.slideProperties?.notesPage?.notesProperties?.speakerNotesObjectId;

  if (!speakerNotesObjectId) {
    throw new SpeakerNotesNotFoundError(validatedInput.slideId);
  }

  // Build batch update requests
  const requests: any[] = [];

  // 1. Delete existing notes (clear all text)
  requests.push({
    deleteText: {
      objectId: speakerNotesObjectId,
      textRange: {
        type: 'ALL',
      },
    },
  });

  // 2. Insert new notes
  requests.push({
    insertText: {
      objectId: speakerNotesObjectId,
      text: validatedInput.notes,
      insertionIndex: 0,
    },
  });

  // Execute the batch update
  await client.batchUpdate(validatedInput.presentationId, requests);

  // Return the result
  return {
    updated: true,
    notesLength: validatedInput.notes.length,
  };
}
