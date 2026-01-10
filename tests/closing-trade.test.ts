import { round, pctChange } from '../src/utils';
import { ClosingTrade } from '../src/closing-trade';
import { HoodTradeTy } from '../types';

describe('ClosingTrade', () => {
  const buyTrade: HoodTradeTy = {
    symbol: 'AAPL',
    quantity: 10,
    price: 150.5,
    process_date: '1/15/2024',
    activity_date: '1/15/2024',
    settle_date: '1/17/2024',
    description: 'Buy AAPL',
    trans_code: 'Buy',
    amount: 1505.0
  };

  const sellTrade: HoodTradeTy = {
    symbol: 'AAPL',
    quantity: 10,
    price: 165.75,
    process_date: '1/20/2024',
    activity_date: '1/20/2024',
    settle_date: '1/22/2024',
    description: 'Sell AAPL',
    trans_code: 'Sell',
    amount: 1657.5
  };

  const closingTrade = new ClosingTrade(buyTrade, sellTrade);
  const buyValue: number = buyTrade.price * buyTrade.quantity;
  const sellValue: number = sellTrade.price * sellTrade.quantity;

  test('constructor initializes properties correctly', () => {
    expect(closingTrade.symbol).toBe('AAPL');
    expect(closingTrade.buy_qty).toBe(10);
    expect(closingTrade.sell_qty).toBe(10);
    expect(closingTrade.buy_price).toBe(150.5);
    expect(closingTrade.sell_price).toBe(165.75);
    expect(closingTrade.buy_process_date).toBe('1/15/2024');
    expect(closingTrade.sell_process_date).toBe('1/20/2024');
    expect(closingTrade.profit).toBe(round(sellValue - buyValue));
    expect(closingTrade.profit_pct).toBeCloseTo(pctChange(sellValue, buyValue));
  });

  test('getHoldingTimeMs returns correct time difference', () => {
    const buyDate = new Date('1/15/2024');
    const sellDate = new Date('1/20/2024');
    const expectedMs = sellDate.getTime() - buyDate.getTime();
    expect(closingTrade.getHoldingTimeMs()).toBe(expectedMs);
  });

  test('getProfit returns correct profit', () => {
    expect(closingTrade.getProfit()).toBe(152.5);
  });

  test('getSymbol returns correct symbol', () => {
    expect(closingTrade.getSymbol()).toBe('AAPL');
  });

  test('getInvestment returns correct investment amount', () => {
    expect(closingTrade.getInvestment()).toBe(1505); // 150.50 * 10
  });

  test('getData returns the entire object', () => {
    expect(closingTrade.getData()).toBe(closingTrade);
  });

  test('getProfitPct returns correct profit percentage', () => {
    expect(closingTrade.getProfitPct()).toBeCloseTo(10.13, 2);
  });
});
