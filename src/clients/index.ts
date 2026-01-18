/**
 * API Client exports
 *
 * Central export point for all Google API client wrappers
 */

// Drive API client
export {
  createDriveClient,
  DriveClient,
  PresentationSummary,
} from './drive-client.js';
// Slides API client
export {
  createSlidesClient,
  PermissionDeniedError,
  PresentationNotFoundError,
  QuotaExceededError,
  SlidesClient,
} from './slides-client.js';
