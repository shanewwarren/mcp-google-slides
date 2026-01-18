/**
 * Common type definitions for the MCP Google Slides server
 */

/**
 * Represents the persisted OAuth tokens stored locally
 */
export interface StoredTokens {
  /** Current access token for API calls */
  accessToken: string;

  /** Long-lived token for obtaining new access tokens */
  refreshToken: string;

  /** Expiration timestamp (milliseconds since epoch) */
  expiresAt: number;

  /** Granted OAuth scopes (space-delimited) */
  scope: string;
}

/**
 * Position and size specification (in inches)
 */
export interface Position {
  /** X coordinate (left edge) in inches */
  x: number;

  /** Y coordinate (top edge) in inches */
  y: number;

  /** Width in inches */
  width: number;

  /** Height in inches */
  height: number;
}

/**
 * RGB color specification (0-1 range for each channel)
 */
export interface RgbColor {
  /** Red channel (0-1) */
  red: number;

  /** Green channel (0-1) */
  green: number;

  /** Blue channel (0-1) */
  blue: number;
}

/**
 * Summary information for a presentation in list results
 */
export interface PresentationSummary {
  /** Unique presentation ID */
  id: string;

  /** Presentation title */
  title: string;

  /** Edit link */
  link: string;

  /** Creation timestamp */
  createdTime?: string;

  /** Last modification timestamp */
  modifiedTime?: string;
}
