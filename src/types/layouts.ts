/**
 * Layout and formatting type definitions for Google Slides
 * Based on Google Slides API specifications
 */

/**
 * Predefined slide layouts supported by Google Slides API
 *
 * Each layout provides different placeholder configurations for structured content.
 * See: https://developers.google.com/slides/api/reference/rest/v1/presentations.pages#LayoutProperties
 */
export type PredefinedLayout =
  | 'PREDEFINED_LAYOUT_UNSPECIFIED' // Unspecified layout (not recommended)
  | 'BLANK' // Empty slide, no placeholders
  | 'CAPTION_ONLY' // Caption at bottom
  | 'TITLE' // Title and subtitle centered
  | 'TITLE_AND_BODY' // Title with content area
  | 'TITLE_AND_TWO_COLUMNS' // Title with two columns
  | 'TITLE_ONLY' // Just a title placeholder
  | 'SECTION_HEADER' // Section divider/break
  | 'SECTION_TITLE_AND_DESCRIPTION' // Section title on one side, description on other
  | 'ONE_COLUMN_TEXT' // Single column text layout
  | 'MAIN_POINT' // Emphasis layout for key points
  | 'BIG_NUMBER'; // Large number display for stats

/**
 * Shape types supported by Google Slides API
 *
 * These are the most commonly used shapes. The API supports additional shapes not listed here.
 * See: https://developers.google.com/slides/api/reference/rest/v1/presentations.pages#shapetype
 */
export type ShapeType =
  // Basic shapes
  | 'RECTANGLE'
  | 'ROUND_RECTANGLE'
  | 'ELLIPSE'
  | 'TRIANGLE'
  | 'PARALLELOGRAM'
  | 'TRAPEZOID'
  | 'PENTAGON'
  | 'HEXAGON'
  | 'DIAMOND'
  // Arrows
  | 'RIGHT_ARROW'
  | 'LEFT_ARROW'
  | 'UP_ARROW'
  | 'DOWN_ARROW'
  | 'LEFT_RIGHT_ARROW'
  | 'UP_DOWN_ARROW'
  | 'BENT_ARROW'
  | 'CURVED_RIGHT_ARROW'
  // Stars and banners
  | 'STAR_4'
  | 'STAR_5'
  | 'STAR_6'
  | 'STAR_8'
  | 'RIBBON'
  | 'RIBBON_2'
  // Callouts
  | 'CALLOUT_RECTANGLE'
  | 'CALLOUT_ROUND_RECTANGLE'
  | 'CALLOUT_ELLIPSE'
  // Special
  | 'TEXT_BOX' // For creating text boxes
  | 'CLOUD'
  | 'HEART'
  | 'PLUS'
  | 'WAVE';

/**
 * Bullet preset configurations for lists
 *
 * Each preset defines bullet/number styles for multiple nesting levels.
 * See: https://developers.google.com/slides/api/reference/rest/v1/presentations/request#createparagraphbulletsrequest
 */
export type BulletPreset =
  // Bullet styles
  | 'BULLET_DISC_CIRCLE_SQUARE' // •, ◦, ▪ (default bullet)
  | 'BULLET_DIAMONDX_ARROW3D_SQUARE' // ◇, ➢, ▪
  | 'BULLET_CHECKBOX' // ☐
  | 'BULLET_ARROW_DIAMOND_DISC' // ➤, ◆, •
  | 'BULLET_STAR_CIRCLE_SQUARE' // ★, ○, ▪
  | 'BULLET_ARROW3D_CIRCLE_SQUARE' // ➢, ○, ▪
  // Numbered styles
  | 'NUMBERED_DIGIT_ALPHA_ROMAN' // 1, a, i (default numbered)
  | 'NUMBERED_DIGIT_ALPHA_ROMAN_PARENS' // 1), a), i)
  | 'NUMBERED_DIGIT_NESTED' // 1., 1.1., 1.1.1.
  | 'NUMBERED_UPPERALPHA_ALPHA_ROMAN' // A, a, i
  | 'NUMBERED_UPPERROMAN_UPPERALPHA_DIGIT'; // I, A, 1

/**
 * Placeholder types on slide layouts
 *
 * Placeholders are predefined text areas in slide layouts that can be populated with content.
 */
export type PlaceholderType = 'TITLE' | 'SUBTITLE' | 'BODY' | 'CENTERED_TITLE' | 'SLIDE_NUMBER';

/**
 * Information about a placeholder on a slide
 */
export interface Placeholder {
  /** Unique object ID of the placeholder */
  objectId: string;

  /** Type of placeholder (title, body, etc.) */
  type: PlaceholderType;

  /** Index for distinguishing multiple placeholders of the same type */
  index?: number;
}

/**
 * Page element types in Google Slides
 */
export type PageElementType =
  | 'SHAPE'
  | 'IMAGE'
  | 'TABLE'
  | 'VIDEO'
  | 'LINE'
  | 'WORD_ART'
  | 'SPEAKER_SPOTLIGHT'
  | 'SHEET_CHART';

/**
 * Basic page element information
 */
export interface PageElement {
  /** Unique object ID */
  objectId: string;

  /** Type of element */
  type: PageElementType;

  /** Brief description of content (optional) */
  description?: string;
}

/**
 * Detailed slide information
 */
export interface SlideInfo {
  /** Unique slide object ID */
  objectId: string;

  /** 0-based position in presentation */
  index: number;

  /** Layout used by this slide */
  layout: string;

  /** Placeholders on this slide */
  placeholders: Placeholder[];

  /** All page elements on this slide */
  elements: PageElement[];
}
