import { sortListsByLastProcessDate } from '../src/utils';

describe('sortListsByLastProcessDate', () => {
  type HoodTradeTy = {
    process_date: string; // Format: MM/DD/YYYY
    // ... other properties if needed
  };

  it('sort lists by their last process date in ascending order', () => {
    const input: HoodTradeTy[][] = [
      [{ process_date: '03/02/2024' }, { process_date: '04/03/2024' }],
      [{ process_date: '03/01/2024' }, { process_date: '03/02/2024' }]
    ];

    const expected: HoodTradeTy[] = [
      { process_date: '03/01/2024' },
      { process_date: '03/02/2024' },
      { process_date: '03/02/2024' },
      { process_date: '04/03/2024' }
    ];

    expect(sortListsByLastProcessDate(input as any)).toEqual(expected);
  });

  it('filter out empty lists', () => {
    const input: HoodTradeTy[][] = [[], [{ process_date: '03/01/2024' }], []];

    const expected: HoodTradeTy[] = [{ process_date: '03/01/2024' }];

    expect(sortListsByLastProcessDate(input as any)).toEqual(expected);
  });

  it('return empty array when all lists are empty', () => {
    const input: HoodTradeTy[][] = [[], [], []];
    expect(sortListsByLastProcessDate(input as any)).toEqual([]);
  });

  it('handle single list correctly', () => {
    const input: HoodTradeTy[][] = [[{ process_date: '03/01/2024' }, { process_date: '03/02/2024' }]];

    const expected: HoodTradeTy[] = [{ process_date: '03/01/2024' }, { process_date: '03/02/2024' }];

    expect(sortListsByLastProcessDate(input as any)).toEqual(expected);
  });
});
