import { calculateSymbolProfits } from '../src/utils';
import { ClosingTrade } from '../src/closing-trade';

describe('calculateSymbolProfits', () => {
  const mk = (sym: string, bq: number, bp: number, sq: number, sp: number) =>
    new ClosingTrade(
      {
        symbol: sym,
        quantity: bq,
        price: bp,
        processDate: '1/1/2023',
        activityDate: '1/1/2023',
        settleDate: '',
        description: '',
        transCode: 'Buy',
        amount: -bq * bp
      },
      {
        symbol: sym,
        quantity: sq,
        price: sp,
        processDate: '6/1/2023',
        activityDate: '6/1/2023',
        settleDate: '',
        description: '',
        transCode: 'Sell',
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
        totalProfit: 50,
        totalProfitPct: 3.33
      }
    ]);
  });
});
