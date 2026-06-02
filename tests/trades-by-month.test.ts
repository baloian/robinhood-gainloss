import { getTradesByMonth } from '../src/utils';
import { HoodTradeTy } from '../types';

describe('getTradesByMonth', () => {
  const mockTrades: HoodTradeTy[] = [
    { processDate: '1/15/2024', symbol: 'AAPL' } as HoodTradeTy,
    { processDate: '2/20/2024', symbol: 'GOOGL' } as HoodTradeTy,
    { processDate: '3/10/2024', symbol: 'MSFT' } as HoodTradeTy,
    { processDate: '4/05/2024', symbol: 'TSLA' } as HoodTradeTy
  ];

  it('return trades for the given month and earlier months', () => {
    const result = getTradesByMonth(mockTrades, '2/2024');
    expect(result).toHaveLength(2);
    expect(result.map((trade) => trade.symbol)).toEqual(['AAPL', 'GOOGL']);
  });

  it('return all trades when given last month', () => {
    const result = getTradesByMonth(mockTrades, '12/2024');
    expect(result).toHaveLength(4);
  });

  it('return only first month trades when given first month', () => {
    const result = getTradesByMonth(mockTrades, '1/2024');
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('AAPL');
  });

  it('return empty array for month before any trades', () => {
    const result = getTradesByMonth(mockTrades, '1/2023');
    expect(result).toHaveLength(0);
  });

  it('handle empty input array', () => {
    const result = getTradesByMonth([], '1/2024');
    expect(result).toHaveLength(0);
  });

  it('handle trades with undefined process_date', () => {
    const tradesWithUndefined = [
      { process_date: undefined, symbol: 'BAD' } as unknown as HoodTradeTy,
      ...mockTrades
    ];
    const result = getTradesByMonth(tradesWithUndefined, '2/2024');
    expect(result).toHaveLength(2);
    expect(result.map((trade) => trade.symbol)).toEqual(['AAPL', 'GOOGL']);
  });
});
