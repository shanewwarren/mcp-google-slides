/**
 * Color parsing utilities for Google Slides
 *
 * Supports multiple color formats and converts them to Google's RGB format (0-1 range).
 */

import { RgbColor } from '../types/common.js';

/**
 * Named CSS color constants
 * Includes common web colors for convenience
 */
const NAMED_COLORS: Record<string, RgbColor> = {
  // Basic colors
  black: { red: 0, green: 0, blue: 0 },
  white: { red: 1, green: 1, blue: 1 },
  red: { red: 1, green: 0, blue: 0 },
  green: { red: 0, green: 0.5, blue: 0 },
  blue: { red: 0, green: 0, blue: 1 },
  yellow: { red: 1, green: 1, blue: 0 },
  cyan: { red: 0, green: 1, blue: 1 },
  magenta: { red: 1, green: 0, blue: 1 },

  // Extended colors
  gray: { red: 0.5, green: 0.5, blue: 0.5 },
  grey: { red: 0.5, green: 0.5, blue: 0.5 },
  silver: { red: 0.753, green: 0.753, blue: 0.753 },
  maroon: { red: 0.5, green: 0, blue: 0 },
  olive: { red: 0.5, green: 0.5, blue: 0 },
  lime: { red: 0, green: 1, blue: 0 },
  aqua: { red: 0, green: 1, blue: 1 },
  teal: { red: 0, green: 0.5, blue: 0.5 },
  navy: { red: 0, green: 0, blue: 0.5 },
  fuchsia: { red: 1, green: 0, blue: 1 },
  purple: { red: 0.5, green: 0, blue: 0.5 },
  orange: { red: 1, green: 0.647, blue: 0 },
  pink: { red: 1, green: 0.753, blue: 0.796 },
  brown: { red: 0.647, green: 0.165, blue: 0.165 },
  gold: { red: 1, green: 0.843, blue: 0 },
  violet: { red: 0.933, green: 0.51, blue: 0.933 },
  indigo: { red: 0.294, green: 0, blue: 0.51 },
  crimson: { red: 0.863, green: 0.078, blue: 0.235 },
  coral: { red: 1, green: 0.498, blue: 0.314 },
  salmon: { red: 0.980, green: 0.502, blue: 0.447 },
  khaki: { red: 0.941, green: 0.902, blue: 0.549 },
  tan: { red: 0.824, green: 0.706, blue: 0.549 },
  beige: { red: 0.961, green: 0.961, blue: 0.863 },
  ivory: { red: 1, green: 1, blue: 0.941 },
  lavender: { red: 0.902, green: 0.902, blue: 0.980 },
  turquoise: { red: 0.251, green: 0.878, blue: 0.816 },
  plum: { red: 0.867, green: 0.627, blue: 0.867 },
  orchid: { red: 0.855, green: 0.439, blue: 0.839 },
  chocolate: { red: 0.824, green: 0.412, blue: 0.118 },
  sienna: { red: 0.627, green: 0.322, blue: 0.176 },
  peru: { red: 0.804, green: 0.522, blue: 0.247 },
  tomato: { red: 1, green: 0.388, blue: 0.278 },
};

/**
 * Custom error thrown when a color cannot be parsed
 */
export class ColorParseError extends Error {
  constructor(input: string, reason?: string) {
    super(
      reason
        ? `Cannot parse color "${input}": ${reason}`
        : `Cannot parse color "${input}"`
    );
    this.name = 'ColorParseError';
  }
}

/**
 * Parses a hex color string (#RRGGBB or #RGB) into an RgbColor
 *
 * @param hex - Hex color string (e.g., "#FF5733" or "#F53")
 * @returns RGB color object with values 0-1
 * @throws ColorParseError if the hex string is invalid
 */
export function parseHexColor(hex: string): RgbColor {
  // Remove # prefix if present
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;

  // Validate hex characters
  if (!/^[0-9A-Fa-f]+$/.test(cleanHex)) {
    throw new ColorParseError(hex, 'contains invalid characters');
  }

  let r: number, g: number, b: number;

  if (cleanHex.length === 3) {
    // Short format (#RGB -> #RRGGBB)
    r = parseInt(cleanHex.charAt(0) + cleanHex.charAt(0), 16);
    g = parseInt(cleanHex.charAt(1) + cleanHex.charAt(1), 16);
    b = parseInt(cleanHex.charAt(2) + cleanHex.charAt(2), 16);
  } else if (cleanHex.length === 6) {
    // Full format (#RRGGBB)
    r = parseInt(cleanHex.slice(0, 2), 16);
    g = parseInt(cleanHex.slice(2, 4), 16);
    b = parseInt(cleanHex.slice(4, 6), 16);
  } else {
    throw new ColorParseError(
      hex,
      `expected 3 or 6 hex digits, got ${cleanHex.length}`
    );
  }

  // Convert from 0-255 to 0-1 range
  return {
    red: r / 255,
    green: g / 255,
    blue: b / 255,
  };
}

/**
 * Parses an RGB color string (rgb(r, g, b)) into an RgbColor
 *
 * @param rgb - RGB color string (e.g., "rgb(255, 87, 51)")
 * @returns RGB color object with values 0-1
 * @throws ColorParseError if the RGB string is invalid
 */
export function parseRgbColor(rgb: string): RgbColor {
  // Match rgb(r, g, b) format with optional whitespace
  const match = rgb.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);

  if (!match || match.length < 4) {
    throw new ColorParseError(rgb, 'expected format rgb(r, g, b)');
  }

  const r = parseInt(match[1]!, 10);
  const g = parseInt(match[2]!, 10);
  const b = parseInt(match[3]!, 10);

  // Validate range
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
    throw new ColorParseError(rgb, 'RGB values must be 0-255');
  }

  // Convert from 0-255 to 0-1 range
  return {
    red: r / 255,
    green: g / 255,
    blue: b / 255,
  };
}

/**
 * Parses a named color into an RgbColor
 *
 * @param name - Color name (e.g., "red", "blue", "coral")
 * @returns RGB color object with values 0-1
 * @throws ColorParseError if the color name is not recognized
 */
export function parseNamedColor(name: string): RgbColor {
  const normalized = name.toLowerCase().trim();
  const color = NAMED_COLORS[normalized];

  if (!color) {
    throw new ColorParseError(
      name,
      'unknown color name (try hex or RGB format)'
    );
  }

  return color;
}

/**
 * Parses a color string in any supported format into an RgbColor
 *
 * Supported formats:
 * - Hex: "#FF5733" or "#F53"
 * - RGB: "rgb(255, 87, 51)"
 * - Named: "red", "blue", "coral", etc.
 *
 * @param input - Color string in any supported format
 * @returns RGB color object with values 0-1
 * @throws ColorParseError if the color cannot be parsed
 *
 * @example
 * parseColor("#FF5733")  // { red: 1, green: 0.341, blue: 0.2 }
 * parseColor("#F53")     // { red: 1, green: 0.333, blue: 0.2 }
 * parseColor("rgb(255, 87, 51)")  // { red: 1, green: 0.341, blue: 0.2 }
 * parseColor("red")      // { red: 1, green: 0, blue: 0 }
 */
export function parseColor(input: string): RgbColor {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new ColorParseError(input, 'empty string');
  }

  // Try hex format
  if (trimmed.startsWith('#')) {
    return parseHexColor(trimmed);
  }

  // Try RGB format
  if (trimmed.toLowerCase().startsWith('rgb(')) {
    return parseRgbColor(trimmed);
  }

  // Try named color
  return parseNamedColor(trimmed);
}

/**
 * Converts an RgbColor to a hex string
 *
 * @param color - RGB color object with values 0-1
 * @returns Hex color string (e.g., "#FF5733")
 *
 * @example
 * toHexColor({ red: 1, green: 0.341, blue: 0.2 })  // "#FF5733"
 */
export function toHexColor(color: RgbColor): string {
  const r = Math.round(color.red * 255)
    .toString(16)
    .padStart(2, '0');
  const g = Math.round(color.green * 255)
    .toString(16)
    .padStart(2, '0');
  const b = Math.round(color.blue * 255)
    .toString(16)
    .padStart(2, '0');

  return `#${r}${g}${b}`.toUpperCase();
}

/**
 * Returns a list of all supported named colors
 *
 * @returns Array of color names
 */
export function getSupportedColorNames(): string[] {
  return Object.keys(NAMED_COLORS).sort();
}
