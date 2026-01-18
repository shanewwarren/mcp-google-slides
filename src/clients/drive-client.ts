/**
 * Google Drive API client wrapper
 *
 * Provides a high-level interface for interacting with the Google Drive API.
 * Used specifically for listing presentations created by this application.
 * All methods use an authenticated OAuth2Client from the auth module.
 */

import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { getAuthenticatedClient } from '../auth/index.js';
import { QuotaExceededError, PermissionDeniedError } from './slides-client.js';

/**
 * Presentation summary for listing
 */
export interface PresentationSummary {
  presentationId: string;
  title: string;
  createdTime: string;
  modifiedTime: string;
  slideCount?: number;
  link: string;
}

/**
 * Google Drive API client wrapper
 */
export class DriveClient {
  private drive: drive_v3.Drive;

  /**
   * Create a new DriveClient
   * @param auth - Authenticated OAuth2Client
   */
  constructor(auth: OAuth2Client) {
    this.drive = google.drive({ version: 'v3', auth });
  }

  /**
   * List presentations created by this application
   *
   * With the drive.file scope, this only returns presentations
   * created by this application.
   *
   * @param limit - Maximum number of presentations to return (default: 10)
   * @returns Array of presentation summaries
   * @throws {PermissionDeniedError} If no access to Drive
   * @throws {QuotaExceededError} If API quota is exceeded
   */
  async listPresentations(limit: number = 10): Promise<PresentationSummary[]> {
    try {
      const response = await this.drive.files.list({
        q: "mimeType='application/vnd.google-apps.presentation'",
        pageSize: limit,
        fields: 'files(id, name, createdTime, modifiedTime, webViewLink)',
        orderBy: 'modifiedTime desc',
      });

      if (!response.data.files) {
        return [];
      }

      return response.data.files.map((file) => ({
        presentationId: file.id || '',
        title: file.name || 'Untitled',
        createdTime: file.createdTime || '',
        modifiedTime: file.modifiedTime || '',
        link: file.webViewLink || `https://docs.google.com/presentation/d/${file.id}/edit`,
      }));
    } catch (error: any) {
      if (error.code === 403) {
        throw new PermissionDeniedError('Drive API');
      }
      if (error.code === 429 || error.message?.includes('quota')) {
        throw new QuotaExceededError();
      }
      throw error;
    }
  }
}

/**
 * Create a DriveClient with automatic authentication
 *
 * This is a convenience function that handles OAuth authentication
 * and returns a ready-to-use DriveClient instance.
 *
 * @returns Authenticated DriveClient
 * @throws {AuthenticationError} If authentication fails
 */
export async function createDriveClient(): Promise<DriveClient> {
  const auth = await getAuthenticatedClient();
  return new DriveClient(auth);
}
