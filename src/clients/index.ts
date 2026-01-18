/**
 * API Client exports
 *
 * Central export point for all Google API client wrappers
 */

// Slides API client
export {
  SlidesClient,
  createSlidesClient,
  PresentationNotFoundError,
  QuotaExceededError,
  PermissionDeniedError,
} from './slides-client.js';

// Drive API client
export {
  DriveClient,
  createDriveClient,
  PresentationSummary,
} from './drive-client.js';
