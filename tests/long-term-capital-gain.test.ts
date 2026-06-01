import { isLongTermCapitalGain } from '../src/utils';

describe('isLongTermCapitalGain', () => {
  it('is short-term when sell is on the one-year anniversary', () => {
    expect(isLongTermCapitalGain('1/1/2023', '1/1/2024')).toBe(false);
  });

  it('is long-term when sell is after the one-year anniversary', () => {
    expect(isLongTermCapitalGain('1/1/2023', '1/2/2024')).toBe(true);
  });
});
