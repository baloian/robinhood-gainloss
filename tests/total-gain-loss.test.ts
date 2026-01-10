import { calculateTotalGainLoss } from '../src/utils';
import { ClosingTrade } from '../src/closing-trade';

describe('calculateTotalGainLoss', () => {
  const sampleTrades: ClosingTrade[] = [
    // Short-term trade (6 months)
    new ClosingTrade(
      {
        symbol: 'AAPL',
        quantity: 10,
        price: 100,
        process_date: '1/1/2023',
        activity_date: '1/1/2023',
        settle_date: '1/3/2023',
        description: 'Buy AAPL',
        trans_code: 'Buy',
        amount: 1000
      },
      {
        symbol: 'AAPL',
        quantity: 10,
        price: 120,
        process_date: '6/1/2023',
        activity_date: '6/1/2023',
        settle_date: '6/3/2023',
        description: 'Sell AAPL',
        trans_code: 'Sell',
        amount: 1200
      }
    ),
    // Long-term trade (over 1 year)
    new ClosingTrade(
      {
        symbol: 'GOOGL',
        quantity: 5,
        price: 200,
        process_date: '1/1/2023',
        activity_date: '1/1/2023',
        settle_date: '1/3/2023',
        description: 'Buy GOOGL',
        trans_code: 'Buy',
        amount: 1000
      },
      {
        symbol: 'GOOGL',
        quantity: 5,
        price: 250,
        process_date: '1/2/2024',
        activity_date: '1/2/2024',
        settle_date: '1/4/2024',
        description: 'Sell GOOGL',
        trans_code: 'Sell',
        amount: 1250
      }
    ),
    // Another short-term trade in different month
    new ClosingTrade(
      {
        symbol: 'MSFT',
        quantity: 8,
        price: 150,
        process_date: '3/1/2023',
        activity_date: '3/1/2023',
        settle_date: '3/3/2023',
        description: 'Buy MSFT',
        trans_code: 'Buy',
        amount: 1200
      },
      {
        symbol: 'MSFT',
        quantity: 8,
        price: 140,
        process_date: '7/1/2023',
        activity_date: '7/1/2023',
        settle_date: '7/3/2023',
        description: 'Sell MSFT',
        trans_code: 'Sell',
        amount: 1120
      }
    )
  ];

  it('calculate short-term gains for a specific month', () => {
    const result = calculateTotalGainLoss(sampleTrades, '6/2023');
    expect(result).toEqual({
      long_term_profit: 0,
      short_term_profit: 200
    });
  });

  it('calculate long-term gains for a specific month', () => {
    const result = calculateTotalGainLoss(sampleTrades, '1/2024');
    expect(result).toEqual({
      long_term_profit: 250,
      short_term_profit: 0
    });
  });

  it('handle months with no trades', () => {
    const result = calculateTotalGainLoss(sampleTrades, '12/2023');
    expect(result).toEqual({
      long_term_profit: 0,
      short_term_profit: 0
    });
  });

  it('handle multiple trades in the same month', () => {
    const multipleTradesMonth: ClosingTrade[] = [
      ...sampleTrades,
      new ClosingTrade(
        {
          symbol: 'TSLA',
          quantity: 3,
          price: 100,
          process_date: '6/1/2023',
          activity_date: '6/1/2023',
          settle_date: '6/3/2023',
          description: 'Buy TSLA',
          trans_code: 'Buy',
          amount: 300
        },
        {
          symbol: 'TSLA',
          quantity: 3,
          price: 90,
          process_date: '7/1/2023',
          activity_date: '7/1/2023',
          settle_date: '7/3/2023',
          description: 'Sell TSLA',
          trans_code: 'Sell',
          amount: 270
        }
      )
    ];

    const result = calculateTotalGainLoss(multipleTradesMonth, '7/2023');
    expect(result).toEqual({
      long_term_profit: 0,
      short_term_profit: -110
    });
  });
});
