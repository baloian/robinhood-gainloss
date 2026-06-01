import { HoodQueue } from '../src/hood-queue';
import { HoodTradeTy } from '../types';
import Validator from '../src/validator';
import { sortTradesByProcessDate } from '../src/utils';

function trade(
  process_date: string,
  trans_code: 'Buy' | 'Sell',
  quantity: number,
  activity_date?: string
): HoodTradeTy {
  const price = 390;
  return {
    activity_date: activity_date ?? process_date,
    process_date,
    settle_date: process_date,
    symbol: 'MSFT',
    description: '',
    trans_code,
    quantity,
    price,
    amount: trans_code === 'Buy' ? -quantity * price : quantity * price
  };
}

describe('MSFT May 2024 same-day FIFO', () => {
  const aprilTrades: HoodTradeTy[] = [
    trade('4/30/2024', 'Buy', 12),
    trade('4/25/2024', 'Buy', 10),
    trade('4/25/2024', 'Buy', 2)
  ];

  const mayTrades: HoodTradeTy[] = [
    trade('5/1/2024', 'Buy', 230),
    trade('5/1/2024', 'Buy', 235),
    trade('5/1/2024', 'Sell', 75),
    trade('5/1/2024', 'Sell', 60),
    trade('5/1/2024', 'Sell', 100),
    trade('5/1/2024', 'Sell', 235),
    trade('5/1/2024', 'Sell', 19),
    trade('5/1/2024', 'Buy', 254)
  ];

  it('allows sell 100 when buys are processed before sells on same day', () => {
    const rows = sortTradesByProcessDate([...aprilTrades, ...mayTrades]);
    const queue = new HoodQueue();
    for (const row of rows) {
      if (row.trans_code === 'Buy') queue.push(row.symbol, { ...row });
      else {
        const err = Validator.verifySell(queue, row.symbol, row.quantity);
        expect(err).toBeNull();
        // consume FIFO without full ClosingTrade logic
        let remaining = row.quantity;
        while (remaining > 0) {
          const buy = queue.front(row.symbol)!;
          const take = Math.min(buy.quantity, remaining);
          buy.quantity -= take;
          remaining -= take;
          if (buy.quantity <= 1e-8) queue.pop(row.symbol);
        }
      }
    }
    expect(queue.getQty('MSFT')).toBeGreaterThan(0);
  });

  it('keeps same activity_date together when process_date differs (settlement lag)', () => {
    const settlementLag: HoodTradeTy[] = [
      trade('5/2/2024', 'Buy', 230, '5/1/2024'),
      trade('5/2/2024', 'Buy', 235, '5/1/2024'),
      trade('5/1/2024', 'Sell', 100, '5/1/2024')
    ];
    const rows = sortTradesByProcessDate([...aprilTrades, ...settlementLag]);
    const queue = new HoodQueue();
    for (const row of rows) {
      if (row.trans_code === 'Buy') queue.push(row.symbol, { ...row });
      else {
        expect(Validator.verifySell(queue, row.symbol, row.quantity)).toBeNull();
        let remaining = row.quantity;
        while (remaining > 0) {
          const buy = queue.front(row.symbol)!;
          const take = Math.min(buy.quantity, remaining);
          buy.quantity -= take;
          remaining -= take;
          if (buy.quantity <= 1e-8) queue.pop(row.symbol);
        }
      }
    }
  });

  it('allows sell 100 when CSV lists same-day sells before buys (newest-first export)', () => {
    const sellsFirst: HoodTradeTy[] = [
      trade('5/1/2024', 'Sell', 100),
      trade('5/1/2024', 'Buy', 230),
      trade('5/1/2024', 'Buy', 235)
    ];
    const rows = sortTradesByProcessDate([...aprilTrades, ...sellsFirst]);
    const queue = new HoodQueue();
    for (const row of rows) {
      if (row.trans_code === 'Buy') queue.push(row.symbol, { ...row });
      else if (row.quantity === 100) {
        expect(Validator.verifySell(queue, row.symbol, row.quantity)).toBeNull();
        return;
      }
    }
    throw new Error('expected sell 100 row');
  });

  it('allows May 2024 statement when rows match newest-first Robinhood export order', () => {
    const mayNewestFirst: HoodTradeTy[] = [
      trade('5/1/2024', 'Buy', 254),
      trade('5/1/2024', 'Sell', 19),
      trade('5/1/2024', 'Sell', 235),
      trade('5/1/2024', 'Sell', 100),
      trade('5/1/2024', 'Sell', 60),
      trade('5/1/2024', 'Sell', 75),
      trade('5/1/2024', 'Buy', 235),
      trade('5/1/2024', 'Buy', 230)
    ];
    const rows = sortTradesByProcessDate([...aprilTrades, ...mayNewestFirst]);
    const queue = new HoodQueue();
    for (const row of rows) {
      if (row.trans_code === 'Buy') queue.push(row.symbol, { ...row });
      else {
        expect(Validator.verifySell(queue, row.symbol, row.quantity)).toBeNull();
        let remaining = row.quantity;
        while (remaining > 0) {
          const buy = queue.front(row.symbol)!;
          const take = Math.min(buy.quantity, remaining);
          buy.quantity -= take;
          remaining -= take;
          if (buy.quantity <= 1e-8) queue.pop(row.symbol);
        }
      }
    }
    expect(queue.getQty('MSFT')).toBeGreaterThan(0);
  });
});
