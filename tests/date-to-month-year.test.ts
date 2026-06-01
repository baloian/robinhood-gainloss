import { dateToMonthYear } from '../src/utils';

describe('dateToMonthYear', () => {
  test('converts MM/DD/YYYY to normalized M/YYYY format', () => {
    expect(dateToMonthYear('05/15/2024')).toBe('5/2024');
    expect(dateToMonthYear('12/01/2023')).toBe('12/2023');
    expect(dateToMonthYear('01/31/2022')).toBe('1/2022');
  });

  test('handles single-digit months and days', () => {
    expect(dateToMonthYear('3/9/2021')).toBe('3/2021');
    expect(dateToMonthYear('6/1/2020')).toBe('6/2020');
  });

  test('returns correct format when input has extra spaces', () => {
    expect(dateToMonthYear(' 07/04/2022 ')).toBe('7/2022');
  });

  test('throws an error on invalid input format', () => {
    expect(() => dateToMonthYear('2024-05-15')).toThrow();
    expect(() => dateToMonthYear('May 15, 2024')).toThrow();
    expect(() => dateToMonthYear('05/2024')).toThrow();
  });
});
