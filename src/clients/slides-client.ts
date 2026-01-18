/**
 * Google Slides API client wrapper
 *
 * Provides a high-level interface for interacting with the Google Slides API.
 * All methods use an authenticated OAuth2Client from the auth module.
 */

import { google, slides_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getAuthenticatedClient } from '../auth/index.js';

/**
 * Error thrown when a presentation is not found or not accessible
 */
export class PresentationNotFoundError extends Error {
  constructor(presentationId: string) {
    super(`Presentation not found or not accessible: ${presentationId}`);
    this.name = 'PresentationNotFoundError';
  }
}

/**
 * Error thrown when API quota is exceeded
 */
export class QuotaExceededError extends Error {
  constructor() {
    super('Google API quota exceeded, please try again later');
    this.name = 'QuotaExceededError';
  }
}

/**
 * Error thrown when permission is denied
 */
export class PermissionDeniedError extends Error {
  constructor(presentationId: string) {
    super(`You don't have permission to access this presentation: ${presentationId}`);
    this.name = 'PermissionDeniedError';
  }
}

/**
 * Google Slides API client wrapper
 */
export class SlidesClient {
  private slides: slides_v1.Slides;

  /**
   * Create a new SlidesClient
   * @param auth - Authenticated OAuth2Client
   */
  constructor(auth: OAuth2Client) {
    this.slides = google.slides({ version: 'v1', auth });
  }

  /**
   * Create a new presentation
   *
   * @param title - Title for the new presentation
   * @returns Presentation data including ID and metadata
   * @throws {QuotaExceededError} If API quota is exceeded
   */
  async createPresentation(title: string): Promise<slides_v1.Schema$Presentation> {
    try {
      const response = await this.slides.presentations.create({
        requestBody: {
          title,
        },
      });

      if (!response.data) {
        throw new Error('No data returned from presentation creation');
      }

      return response.data;
    } catch (error: any) {
      if (error.code === 429 || error.message?.includes('quota')) {
        throw new QuotaExceededError();
      }
      throw error;
    }
  }

  /**
   * Get a presentation by ID
   *
   * @param presentationId - The ID of the presentation to retrieve
   * @returns Full presentation data including all slides
   * @throws {PresentationNotFoundError} If presentation not found
   * @throws {PermissionDeniedError} If no access to presentation
   * @throws {QuotaExceededError} If API quota is exceeded
   */
  async getPresentation(presentationId: string): Promise<slides_v1.Schema$Presentation> {
    try {
      const response = await this.slides.presentations.get({
        presentationId,
      });

      if (!response.data) {
        throw new PresentationNotFoundError(presentationId);
      }

      return response.data;
    } catch (error: any) {
      if (error.code === 404) {
        throw new PresentationNotFoundError(presentationId);
      }
      if (error.code === 403) {
        throw new PermissionDeniedError(presentationId);
      }
      if (error.code === 429 || error.message?.includes('quota')) {
        throw new QuotaExceededError();
      }
      throw error;
    }
  }

  /**
   * Execute a batch update on a presentation
   *
   * @param presentationId - The ID of the presentation to update
   * @param requests - Array of update requests
   * @returns Batch update response with replies
   * @throws {PresentationNotFoundError} If presentation not found
   * @throws {PermissionDeniedError} If no access to presentation
   * @throws {QuotaExceededError} If API quota is exceeded
   */
  async batchUpdate(
    presentationId: string,
    requests: slides_v1.Schema$Request[]
  ): Promise<slides_v1.Schema$BatchUpdatePresentationResponse> {
    try {
      const response = await this.slides.presentations.batchUpdate({
        presentationId,
        requestBody: {
          requests,
        },
      });

      if (!response.data) {
        throw new Error('No data returned from batch update');
      }

      return response.data;
    } catch (error: any) {
      if (error.code === 404) {
        throw new PresentationNotFoundError(presentationId);
      }
      if (error.code === 403) {
        throw new PermissionDeniedError(presentationId);
      }
      if (error.code === 429 || error.message?.includes('quota')) {
        throw new QuotaExceededError();
      }
      throw error;
    }
  }

  /**
   * Get a specific slide from a presentation
   *
   * @param presentationId - The ID of the presentation
   * @param pageObjectId - The object ID of the slide/page
   * @returns Slide/page data
   * @throws {PresentationNotFoundError} If presentation not found
   * @throws {PermissionDeniedError} If no access to presentation
   * @throws {QuotaExceededError} If API quota is exceeded
   */
  async getSlide(
    presentationId: string,
    pageObjectId: string
  ): Promise<slides_v1.Schema$Page> {
    try {
      const response = await this.slides.presentations.pages.get({
        presentationId,
        pageObjectId,
      });

      if (!response.data) {
        throw new Error(`Slide not found: ${pageObjectId}`);
      }

      return response.data;
    } catch (error: any) {
      if (error.code === 404) {
        throw new PresentationNotFoundError(presentationId);
      }
      if (error.code === 403) {
        throw new PermissionDeniedError(presentationId);
      }
      if (error.code === 429 || error.message?.includes('quota')) {
        throw new QuotaExceededError();
      }
      throw error;
    }
  }
}

/**
 * Create a SlidesClient with automatic authentication
 *
 * This is a convenience function that handles OAuth authentication
 * and returns a ready-to-use SlidesClient instance.
 *
 * @returns Authenticated SlidesClient
 * @throws {AuthenticationError} If authentication fails
 */
export async function createSlidesClient(): Promise<SlidesClient> {
  const auth = await getAuthenticatedClient();
  return new SlidesClient(auth);
}
