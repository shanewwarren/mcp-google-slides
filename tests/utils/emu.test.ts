/**
 * Unit tests for EMU conversion utilities
 */

import {
  EMU_PER_INCH,
  EMU_PER_POINT,
  EMU_PER_CM,
  inchesToEmu,
  emuToInches,
  pointsToEmu,
  emuToPoints,
  cmToEmu,
  emuToCm,
} from '../../src/utils/emu.js';

describe('EMU Conversion Constants', () => {
  test('EMU_PER_INCH is correct', () => {
    expect(EMU_PER_INCH).toBe(914400);
  });

  test('EMU_PER_POINT is correct', () => {
    expect(EMU_PER_POINT).toBe(12700);
  });

  test('EMU_PER_CM is correct', () => {
    expect(EMU_PER_CM).toBe(360000);
  });
});

describe('inchesToEmu', () => {
  test('converts 1 inch to EMU', () => {
    expect(inchesToEmu(1)).toBe(914400);
  });

  test('converts 0 inches to EMU', () => {
    expect(inchesToEmu(0)).toBe(0);
  });

  test('converts fractional inches to EMU', () => {
    expect(inchesToEmu(0.5)).toBe(457200);
  });

  test('converts 10 inches to EMU', () => {
    expect(inchesToEmu(10)).toBe(9144000);
  });

  test('rounds to nearest integer EMU', () => {
    // 0.0001 inches = 91.44 EMU, should round to 91
    expect(inchesToEmu(0.0001)).toBe(91);
  });

  test('handles negative values', () => {
    expect(inchesToEmu(-1)).toBe(-914400);
  });
});

describe('emuToInches', () => {
  test('converts 914400 EMU to 1 inch', () => {
    expect(emuToInches(914400)).toBe(1);
  });

  test('converts 0 EMU to 0 inches', () => {
    expect(emuToInches(0)).toBe(0);
  });

  test('converts fractional EMU to inches', () => {
    expect(emuToInches(457200)).toBe(0.5);
  });

  test('converts 9144000 EMU to 10 inches', () => {
    expect(emuToInches(9144000)).toBe(10);
  });

  test('handles negative values', () => {
    expect(emuToInches(-914400)).toBe(-1);
  });

  test('preserves precision for small values', () => {
    expect(emuToInches(100)).toBeCloseTo(0.000109361, 6);
  });
});

describe('pointsToEmu', () => {
  test('converts 1 point to EMU', () => {
    expect(pointsToEmu(1)).toBe(12700);
  });

  test('converts 0 points to EMU', () => {
    expect(pointsToEmu(0)).toBe(0);
  });

  test('converts 12 points (1 pica) to EMU', () => {
    expect(pointsToEmu(12)).toBe(152400);
  });

  test('converts 72 points (1 inch) to EMU', () => {
    // 72 points = 1 inch = 914400 EMU
    expect(pointsToEmu(72)).toBe(914400);
  });

  test('rounds to nearest integer EMU', () => {
    // 0.001 points = 12.7 EMU, should round to 13
    expect(pointsToEmu(0.001)).toBe(13);
  });

  test('handles negative values', () => {
    expect(pointsToEmu(-10)).toBe(-127000);
  });
});

describe('emuToPoints', () => {
  test('converts 12700 EMU to 1 point', () => {
    expect(emuToPoints(12700)).toBe(1);
  });

  test('converts 0 EMU to 0 points', () => {
    expect(emuToPoints(0)).toBe(0);
  });

  test('converts 152400 EMU to 12 points', () => {
    expect(emuToPoints(152400)).toBe(12);
  });

  test('converts 914400 EMU (1 inch) to 72 points', () => {
    expect(emuToPoints(914400)).toBe(72);
  });

  test('handles negative values', () => {
    expect(emuToPoints(-127000)).toBeCloseTo(-10, 6);
  });

  test('preserves precision for small values', () => {
    expect(emuToPoints(100)).toBeCloseTo(0.007874, 6);
  });
});

describe('cmToEmu', () => {
  test('converts 1 cm to EMU', () => {
    expect(cmToEmu(1)).toBe(360000);
  });

  test('converts 0 cm to EMU', () => {
    expect(cmToEmu(0)).toBe(0);
  });

  test('converts 2.54 cm (1 inch) to EMU', () => {
    // 2.54 cm = 1 inch = 914400 EMU
    expect(cmToEmu(2.54)).toBe(914400);
  });

  test('converts fractional cm to EMU', () => {
    expect(cmToEmu(0.5)).toBe(180000);
  });

  test('rounds to nearest integer EMU', () => {
    // 0.001 cm = 360 EMU
    expect(cmToEmu(0.001)).toBe(360);
  });

  test('handles negative values', () => {
    expect(cmToEmu(-5)).toBe(-1800000);
  });
});

describe('emuToCm', () => {
  test('converts 360000 EMU to 1 cm', () => {
    expect(emuToCm(360000)).toBe(1);
  });

  test('converts 0 EMU to 0 cm', () => {
    expect(emuToCm(0)).toBe(0);
  });

  test('converts 914400 EMU (1 inch) to 2.54 cm', () => {
    expect(emuToCm(914400)).toBeCloseTo(2.54, 6);
  });

  test('converts 180000 EMU to 0.5 cm', () => {
    expect(emuToCm(180000)).toBe(0.5);
  });

  test('handles negative values', () => {
    expect(emuToCm(-1800000)).toBe(-5);
  });

  test('preserves precision for small values', () => {
    expect(emuToCm(100)).toBeCloseTo(0.000278, 6);
  });
});

describe('Round-trip conversions', () => {
  test('inches -> EMU -> inches', () => {
    const inches = 5.75;
    expect(emuToInches(inchesToEmu(inches))).toBeCloseTo(inches, 6);
  });

  test('points -> EMU -> points', () => {
    const points = 14.5;
    expect(emuToPoints(pointsToEmu(points))).toBeCloseTo(points, 6);
  });

  test('cm -> EMU -> cm', () => {
    const cm = 10.25;
    expect(emuToCm(cmToEmu(cm))).toBeCloseTo(cm, 6);
  });
});

describe('Cross-unit conversions', () => {
  test('1 inch equals 72 points', () => {
    const inchesInEmu = inchesToEmu(1);
    const pointsInEmu = pointsToEmu(72);
    expect(inchesInEmu).toBe(pointsInEmu);
  });

  test('1 inch equals 2.54 cm', () => {
    const inchesInEmu = inchesToEmu(1);
    const cmInEmu = cmToEmu(2.54);
    expect(inchesInEmu).toBe(cmInEmu);
  });

  test('72 points equals 2.54 cm', () => {
    const pointsInEmu = pointsToEmu(72);
    const cmInEmu = cmToEmu(2.54);
    expect(pointsInEmu).toBe(cmInEmu);
  });
});
