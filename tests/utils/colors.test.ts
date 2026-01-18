/**
 * Unit tests for color parsing utilities
 */

import type { RgbColor } from '../../src/types/common.js';
import {
  ColorParseError,
  getSupportedColorNames,
  parseColor,
  parseHexColor,
  parseNamedColor,
  parseRgbColor,
  toHexColor,
} from '../../src/utils/colors.js';

describe('ColorParseError', () => {
  test('creates error with message', () => {
    const error = new ColorParseError('invalid', 'test reason');
    expect(error.message).toBe('Cannot parse color "invalid": test reason');
    expect(error.name).toBe('ColorParseError');
  });

  test('creates error without reason', () => {
    const error = new ColorParseError('invalid');
    expect(error.message).toBe('Cannot parse color "invalid"');
  });
});

describe('parseHexColor', () => {
  describe('6-digit hex format', () => {
    test('parses #FF5733', () => {
      const result = parseHexColor('#FF5733');
      expect(result.red).toBeCloseTo(1, 3);
      expect(result.green).toBeCloseTo(0.341, 3);
      expect(result.blue).toBeCloseTo(0.2, 3);
    });

    test('parses #000000 (black)', () => {
      expect(parseHexColor('#000000')).toEqual({
        red: 0,
        green: 0,
        blue: 0,
      });
    });

    test('parses #FFFFFF (white)', () => {
      expect(parseHexColor('#FFFFFF')).toEqual({
        red: 1,
        green: 1,
        blue: 1,
      });
    });

    test('parses lowercase hex', () => {
      const result = parseHexColor('#ff5733');
      expect(result.red).toBeCloseTo(1, 3);
      expect(result.green).toBeCloseTo(0.341, 3);
      expect(result.blue).toBeCloseTo(0.2, 3);
    });

    test('parses hex without # prefix', () => {
      const result = parseHexColor('FF5733');
      expect(result.red).toBeCloseTo(1, 3);
      expect(result.green).toBeCloseTo(0.341, 3);
      expect(result.blue).toBeCloseTo(0.2, 3);
    });
  });

  describe('3-digit hex format', () => {
    test('parses #F53', () => {
      const result = parseHexColor('#F53');
      expect(result.red).toBeCloseTo(1, 3);
      expect(result.green).toBeCloseTo(0.333, 3);
      expect(result.blue).toBeCloseTo(0.2, 3);
    });

    test('parses #000 (black)', () => {
      expect(parseHexColor('#000')).toEqual({
        red: 0,
        green: 0,
        blue: 0,
      });
    });

    test('parses #FFF (white)', () => {
      expect(parseHexColor('#FFF')).toEqual({
        red: 1,
        green: 1,
        blue: 1,
      });
    });

    test('expands short format correctly', () => {
      // #F00 should become #FF0000 (red)
      expect(parseHexColor('#F00')).toEqual({
        red: 1,
        green: 0,
        blue: 0,
      });
    });
  });

  describe('error cases', () => {
    test('throws on invalid characters', () => {
      expect(() => parseHexColor('#GGGGGG')).toThrow(ColorParseError);
      expect(() => parseHexColor('#GGGGGG')).toThrow('invalid characters');
    });

    test('throws on wrong length', () => {
      expect(() => parseHexColor('#FF')).toThrow(ColorParseError);
      expect(() => parseHexColor('#FF')).toThrow('expected 3 or 6 hex digits');
    });

    test('throws on too long hex', () => {
      expect(() => parseHexColor('#FFFFFFF')).toThrow(ColorParseError);
    });

    test('throws on empty string', () => {
      expect(() => parseHexColor('#')).toThrow(ColorParseError);
    });
  });
});

describe('parseRgbColor', () => {
  test('parses rgb(255, 87, 51)', () => {
    const result = parseRgbColor('rgb(255, 87, 51)');
    expect(result.red).toBeCloseTo(1, 3);
    expect(result.green).toBeCloseTo(0.341, 3);
    expect(result.blue).toBeCloseTo(0.2, 3);
  });

  test('parses rgb(0, 0, 0) (black)', () => {
    expect(parseRgbColor('rgb(0, 0, 0)')).toEqual({
      red: 0,
      green: 0,
      blue: 0,
    });
  });

  test('parses rgb(255, 255, 255) (white)', () => {
    expect(parseRgbColor('rgb(255, 255, 255)')).toEqual({
      red: 1,
      green: 1,
      blue: 1,
    });
  });

  test('handles extra whitespace', () => {
    const result = parseRgbColor('rgb( 255 , 87 , 51 )');
    expect(result.red).toBeCloseTo(1, 3);
    expect(result.green).toBeCloseTo(0.341, 3);
    expect(result.blue).toBeCloseTo(0.2, 3);
  });

  test('handles no whitespace', () => {
    const result = parseRgbColor('rgb(255,87,51)');
    expect(result.red).toBeCloseTo(1, 3);
    expect(result.green).toBeCloseTo(0.341, 3);
    expect(result.blue).toBeCloseTo(0.2, 3);
  });

  test('is case insensitive', () => {
    const result = parseRgbColor('RGB(255, 87, 51)');
    expect(result.red).toBeCloseTo(1, 3);
  });

  describe('error cases', () => {
    test('throws on invalid format', () => {
      expect(() => parseRgbColor('rgb(255, 87)')).toThrow(ColorParseError);
      expect(() => parseRgbColor('rgb(255, 87)')).toThrow('expected format rgb(r, g, b)');
    });

    test('throws on values > 255', () => {
      expect(() => parseRgbColor('rgb(256, 0, 0)')).toThrow(ColorParseError);
      expect(() => parseRgbColor('rgb(256, 0, 0)')).toThrow('RGB values must be 0-255');
    });

    test('throws on negative values', () => {
      expect(() => parseRgbColor('rgb(-1, 0, 0)')).toThrow(ColorParseError);
      expect(() => parseRgbColor('rgb(-1, 0, 0)')).toThrow('expected format rgb(r, g, b)');
    });

    test('throws on non-numeric values', () => {
      expect(() => parseRgbColor('rgb(red, green, blue)')).toThrow(ColorParseError);
    });

    test('throws on missing parentheses', () => {
      expect(() => parseRgbColor('rgb 255, 87, 51')).toThrow(ColorParseError);
    });
  });
});

describe('parseNamedColor', () => {
  test('parses basic colors', () => {
    expect(parseNamedColor('red')).toEqual({ red: 1, green: 0, blue: 0 });
    expect(parseNamedColor('green')).toEqual({ red: 0, green: 0.5, blue: 0 });
    expect(parseNamedColor('blue')).toEqual({ red: 0, green: 0, blue: 1 });
    expect(parseNamedColor('white')).toEqual({ red: 1, green: 1, blue: 1 });
    expect(parseNamedColor('black')).toEqual({ red: 0, green: 0, blue: 0 });
  });

  test('parses extended colors', () => {
    expect(parseNamedColor('coral')).toEqual({
      red: 1,
      green: 0.498,
      blue: 0.314,
    });
    expect(parseNamedColor('turquoise')).toEqual({
      red: 0.251,
      green: 0.878,
      blue: 0.816,
    });
    expect(parseNamedColor('orchid')).toEqual({
      red: 0.855,
      green: 0.439,
      blue: 0.839,
    });
  });

  test('is case insensitive', () => {
    expect(parseNamedColor('RED')).toEqual({ red: 1, green: 0, blue: 0 });
    expect(parseNamedColor('Red')).toEqual({ red: 1, green: 0, blue: 0 });
    expect(parseNamedColor('rEd')).toEqual({ red: 1, green: 0, blue: 0 });
  });

  test('handles whitespace', () => {
    expect(parseNamedColor('  red  ')).toEqual({ red: 1, green: 0, blue: 0 });
  });

  test('supports both gray and grey', () => {
    expect(parseNamedColor('gray')).toEqual({
      red: 0.5,
      green: 0.5,
      blue: 0.5,
    });
    expect(parseNamedColor('grey')).toEqual({
      red: 0.5,
      green: 0.5,
      blue: 0.5,
    });
  });

  test('throws on unknown color', () => {
    expect(() => parseNamedColor('notacolor')).toThrow(ColorParseError);
    expect(() => parseNamedColor('notacolor')).toThrow('unknown color name');
  });
});

describe('parseColor', () => {
  test('parses hex colors', () => {
    const result = parseColor('#FF5733');
    expect(result.red).toBeCloseTo(1, 3);
    expect(result.green).toBeCloseTo(0.341, 3);
    expect(result.blue).toBeCloseTo(0.2, 3);
  });

  test('parses RGB colors', () => {
    const result = parseColor('rgb(255, 87, 51)');
    expect(result.red).toBeCloseTo(1, 3);
    expect(result.green).toBeCloseTo(0.341, 3);
    expect(result.blue).toBeCloseTo(0.2, 3);
  });

  test('parses named colors', () => {
    expect(parseColor('red')).toEqual({ red: 1, green: 0, blue: 0 });
  });

  test('handles whitespace', () => {
    expect(parseColor('  #FF5733  ')).toBeTruthy();
    expect(parseColor('  rgb(255, 87, 51)  ')).toBeTruthy();
    expect(parseColor('  red  ')).toBeTruthy();
  });

  test('throws on empty string', () => {
    expect(() => parseColor('')).toThrow(ColorParseError);
    expect(() => parseColor('')).toThrow('empty string');
  });

  test('throws on whitespace-only string', () => {
    expect(() => parseColor('   ')).toThrow(ColorParseError);
  });
});

describe('toHexColor', () => {
  test('converts red to #FF0000', () => {
    expect(toHexColor({ red: 1, green: 0, blue: 0 })).toBe('#FF0000');
  });

  test('converts green to hex', () => {
    expect(toHexColor({ red: 0, green: 0.5, blue: 0 })).toBe('#008000');
  });

  test('converts blue to #0000FF', () => {
    expect(toHexColor({ red: 0, green: 0, blue: 1 })).toBe('#0000FF');
  });

  test('converts black to #000000', () => {
    expect(toHexColor({ red: 0, green: 0, blue: 0 })).toBe('#000000');
  });

  test('converts white to #FFFFFF', () => {
    expect(toHexColor({ red: 1, green: 1, blue: 1 })).toBe('#FFFFFF');
  });

  test('converts fractional values correctly', () => {
    const color: RgbColor = { red: 1, green: 0.341, blue: 0.2 };
    expect(toHexColor(color)).toBe('#FF5733');
  });

  test('pads single digits with zeros', () => {
    const color: RgbColor = { red: 0.039, green: 0.039, blue: 0.039 };
    // 0.039 * 255 ≈ 10 = 0x0A
    expect(toHexColor(color)).toBe('#0A0A0A');
  });

  test('rounds values correctly', () => {
    const color: RgbColor = { red: 0.501, green: 0.499, blue: 0.5 };
    // 0.501 * 255 ≈ 128, 0.499 * 255 ≈ 127, 0.5 * 255 = 127.5 -> 128
    expect(toHexColor(color)).toBe('#807F80');
  });
});

describe('getSupportedColorNames', () => {
  test('returns an array of color names', () => {
    const names = getSupportedColorNames();
    expect(Array.isArray(names)).toBe(true);
    expect(names.length).toBeGreaterThan(0);
  });

  test('includes basic colors', () => {
    const names = getSupportedColorNames();
    expect(names).toContain('red');
    expect(names).toContain('green');
    expect(names).toContain('blue');
    expect(names).toContain('white');
    expect(names).toContain('black');
  });

  test('includes extended colors', () => {
    const names = getSupportedColorNames();
    expect(names).toContain('coral');
    expect(names).toContain('turquoise');
    expect(names).toContain('orchid');
  });

  test('is sorted alphabetically', () => {
    const names = getSupportedColorNames();
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  test('includes both gray and grey', () => {
    const names = getSupportedColorNames();
    expect(names).toContain('gray');
    expect(names).toContain('grey');
  });
});

describe('Round-trip conversions', () => {
  test('hex -> parseColor -> toHexColor', () => {
    const original = '#FF5733';
    const parsed = parseColor(original);
    const converted = toHexColor(parsed);
    expect(converted).toBe(original);
  });

  test('RGB -> parseColor -> toHexColor', () => {
    const rgb = 'rgb(255, 87, 51)';
    const parsed = parseColor(rgb);
    const converted = toHexColor(parsed);
    expect(converted).toBe('#FF5733');
  });

  test('named color -> parseColor -> toHexColor', () => {
    const parsed = parseColor('red');
    const converted = toHexColor(parsed);
    expect(converted).toBe('#FF0000');
  });
});

describe('Cross-format parsing consistency', () => {
  test('all formats parse to same color', () => {
    const hex = parseColor('#FF5733');
    const rgb = parseColor('rgb(255, 87, 51)');

    expect(hex.red).toBeCloseTo(rgb.red, 3);
    expect(hex.green).toBeCloseTo(rgb.green, 3);
    expect(hex.blue).toBeCloseTo(rgb.blue, 3);
  });

  test('short hex expands correctly', () => {
    const short = parseColor('#F00');
    const long = parseColor('#FF0000');

    expect(short).toEqual(long);
  });
});
