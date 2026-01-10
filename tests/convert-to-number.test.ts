import { convertToNumber } from '../src/utils';

describe('convertToNumber', () => {
  test('converts positive number in $123 format to number', () => {
    expect(convertToNumber('$123')).toBe(123);
  });

  test('converts positive number with comma in $1,234 format to number', () => {
    expect(convertToNumber('$1,234')).toBe(1234);
  });

  test('converts negative number in ($123) format to number', () => {
    expect(convertToNumber('(-$123)')).toBe(-123);
  });

  test('converts negative number with comma in ($1,234) format to number', () => {
    expect(convertToNumber('(-$1,234)')).toBe(-1234);
  });

  test('returns 0 for input $0', () => {
    expect(convertToNumber('$0')).toBe(0);
  });

  test('returns NaN for non-numeric input', () => {
    expect(convertToNumber('abc')).toBeNaN();
  });

  test('handles empty string by returning NaN', () => {
    expect(convertToNumber('')).toBeNaN();
  });

  test('converts large positive number with comma in $1,000,000 format to number', () => {
    expect(convertToNumber('$1,000,000')).toBe(1000000);
  });

  test('converts large negative number with comma in ($1,000,000) format to number', () => {
    expect(convertToNumber('(-$1,000,000)')).toBe(-1000000);
  });
});
