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
        processDate: '1/1/2023',
        activityDate: '1/1/2023',
        settleDate: '1/3/2023',
        description: 'Buy AAPL',
        transCode: 'Buy',
        amount: 1000
      },
      {
        symbol: 'AAPL',
        quantity: 10,
        price: 120,
        processDate: '6/1/2023',
        activityDate: '6/1/2023',
        settleDate: '6/3/2023',
        description: 'Sell AAPL',
        transCode: 'Sell',
        amount: 1200
      }
    ),
    // Long-term trade (over 1 year)
    new ClosingTrade(
      {
        symbol: 'GOOGL',
        quantity: 5,
        price: 200,
        processDate: '1/1/2023',
        activityDate: '1/1/2023',
        settleDate: '1/3/2023',
        description: 'Buy GOOGL',
        transCode: 'Buy',
        amount: 1000
      },
      {
        symbol: 'GOOGL',
        quantity: 5,
        price: 250,
        processDate: '1/2/2024',
        activityDate: '1/2/2024',
        settleDate: '1/4/2024',
        description: 'Sell GOOGL',
        transCode: 'Sell',
        amount: 1250
      }
    ),
    // Another short-term trade in different month
    new ClosingTrade(
      {
        symbol: 'MSFT',
        quantity: 8,
        price: 150,
        processDate: '3/1/2023',
        activityDate: '3/1/2023',
        settleDate: '3/3/2023',
        description: 'Buy MSFT',
        transCode: 'Buy',
        amount: 1200
      },
      {
        symbol: 'MSFT',
        quantity: 8,
        price: 140,
        processDate: '7/1/2023',
        activityDate: '7/1/2023',
        settleDate: '7/3/2023',
        description: 'Sell MSFT',
        transCode: 'Sell',
        amount: 1120
      }
    )
  ];

  it('calculate short-term gains for a specific month', () => {
    const result = calculateTotalGainLoss(sampleTrades, '6/2023');
    expect(result).toEqual({
      longTermProfit: 0,
      shortTermProfit: 200
    });
  });

  it('calculate long-term gains for a specific month', () => {
    const result = calculateTotalGainLoss(sampleTrades, '1/2024');
    expect(result).toEqual({
      longTermProfit: 250,
      shortTermProfit: 0
    });
  });

  it('handle months with no trades', () => {
    const result = calculateTotalGainLoss(sampleTrades, '12/2023');
    expect(result).toEqual({
      longTermProfit: 0,
      shortTermProfit: 0
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
          processDate: '6/1/2023',
          activityDate: '6/1/2023',
          settleDate: '6/3/2023',
          description: 'Buy TSLA',
          transCode: 'Buy',
          amount: 300
        },
        {
          symbol: 'TSLA',
          quantity: 3,
          price: 90,
          processDate: '7/1/2023',
          activityDate: '7/1/2023',
          settleDate: '7/3/2023',
          description: 'Sell TSLA',
          transCode: 'Sell',
          amount: 270
        }
      )
    ];

    const result = calculateTotalGainLoss(multipleTradesMonth, '7/2023');
    expect(result).toEqual({
      longTermProfit: 0,
      shortTermProfit: -110
    });
  });
});
