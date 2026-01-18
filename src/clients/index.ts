/**
 * API Client exports
 *
 * Central export point for all Google API client wrappers
 */

// Drive API client
export { createDriveClient, DriveClient } from './drive-client.js';
export type { PresentationSummary } from './drive-client.js';
// Slides API client
export {
  createSlidesClient,
  PermissionDeniedError,
  PresentationNotFoundError,
  QuotaExceededError,
  SlidesClient,
} from './slides-client.js';
