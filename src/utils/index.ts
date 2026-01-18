/**
 * Utility function exports
 */

// Color parsing utilities
export {
  ColorParseError,
  getSupportedColorNames,
  parseColor,
  parseHexColor,
  parseNamedColor,
  parseRgbColor,
  toHexColor,
} from './colors.js';
// EMU conversion utilities
export {
  cmToEmu,
  EMU_PER_CM,
  EMU_PER_INCH,
  EMU_PER_POINT,
  emuToCm,
  emuToInches,
  emuToPoints,
  inchesToEmu,
  pointsToEmu,
} from './emu.js';
