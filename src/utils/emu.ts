/**
 * EMU (English Metric Units) Conversion Utilities
 *
 * Google Slides API uses EMU for all positioning and sizing.
 * These utilities convert between EMU and common units like inches, points, and centimeters.
 */

/**
 * Conversion constants
 */
export const EMU_PER_INCH = 914400;
export const EMU_PER_POINT = 12700;
export const EMU_PER_CM = 360000;

/**
 * Converts inches to EMU
 * @param inches - Value in inches
 * @returns Value in EMU
 */
export function inchesToEmu(inches: number): number {
  return Math.round(inches * EMU_PER_INCH);
}

/**
 * Converts EMU to inches
 * @param emu - Value in EMU
 * @returns Value in inches
 */
export function emuToInches(emu: number): number {
  return emu / EMU_PER_INCH;
}

/**
 * Converts points to EMU
 * @param points - Value in points
 * @returns Value in EMU
 */
export function pointsToEmu(points: number): number {
  return Math.round(points * EMU_PER_POINT);
}

/**
 * Converts EMU to points
 * @param emu - Value in EMU
 * @returns Value in points
 */
export function emuToPoints(emu: number): number {
  return emu / EMU_PER_POINT;
}

/**
 * Converts centimeters to EMU
 * @param cm - Value in centimeters
 * @returns Value in EMU
 */
export function cmToEmu(cm: number): number {
  return Math.round(cm * EMU_PER_CM);
}

/**
 * Converts EMU to centimeters
 * @param emu - Value in EMU
 * @returns Value in centimeters
 */
export function emuToCm(emu: number): number {
  return emu / EMU_PER_CM;
}
