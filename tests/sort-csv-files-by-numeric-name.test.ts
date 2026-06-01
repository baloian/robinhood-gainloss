import { csvFileNumericSortKey, sortCsvFilesByNumericName } from '../src/utils';

describe('sortCsvFilesByNumericName', () => {
  it('sorts files by numeric filename in ascending order', () => {
    const input = ['/data/10.csv', '/data/2.csv', '/data/1.csv', '/data/3.csv'];
    expect(sortCsvFilesByNumericName(input)).toEqual([
      '/data/1.csv',
      '/data/2.csv',
      '/data/3.csv',
      '/data/10.csv'
    ]);
  });

  it('accepts zero-padded numeric filenames', () => {
    expect(csvFileNumericSortKey('/data/01.csv')).toBe(1);
    expect(csvFileNumericSortKey('/data/1.csv')).toBe(1);
  });

  it('throws when filename is not numeric', () => {
    expect(() => csvFileNumericSortKey('/data/report.csv')).toThrow(
      'CSV filename must be a number (e.g. 1.csv), got: report.csv'
    );
  });
});
