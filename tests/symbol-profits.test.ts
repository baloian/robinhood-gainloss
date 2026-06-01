import { calculateSymbolProfits } from '../src/utils';
import { ClosingTrade } from '../src/closing-trade';

describe('calculateSymbolProfits', () => {
  const mk = (sym: string, bq: number, bp: number, sq: number, sp: number) =>
    new ClosingTrade(
      {
        symbol: sym,
        quantity: bq,
        price: bp,
        process_date: '1/1/2023',
        activity_date: '1/1/2023',
        settle_date: '',
        description: '',
        trans_code: 'Buy',
        amount: -bq * bp
      },
      {
        symbol: sym,
        quantity: sq,
        price: sp,
        process_date: '6/1/2023',
        activity_date: '6/1/2023',
        settle_date: '',
        description: '',
        trans_code: 'Sell',
        amount: sq * sp
      }
    );

  it('aggregates profit and weighted return percent per symbol', () => {
    const t1 = mk('A', 10, 100, 10, 110);
    const t2 = mk('A', 5, 100, 5, 90);
    const result = calculateSymbolProfits([t1, t2], '6/2023');
    expect(result).toEqual([
      {
        symbol: 'A',
        total_profit: 50,
        total_profit_pct: 3.33
      }
    ]);
  });
});
