/**
 * Utility function exports
 */

// EMU conversion utilities
export {
  EMU_PER_INCH,
  EMU_PER_POINT,
  EMU_PER_CM,
  inchesToEmu,
  emuToInches,
  pointsToEmu,
  emuToPoints,
  cmToEmu,
  emuToCm,
} from './emu.js';

// Color parsing utilities
export {
  parseColor,
  parseHexColor,
  parseRgbColor,
  parseNamedColor,
  toHexColor,
  getSupportedColorNames,
  ColorParseError,
} from './colors.js';
