import { HoodMonthData } from '../src/hood-month-data';
import { HoodTradeTy } from '../types';

describe('HoodMonthData', () => {
  const sampleData: HoodTradeTy[] = [
    {
      process_date: '3/15/2024',
      activity_date: '3/15/2024',
      settle_date: '3/17/2024',
      symbol: 'AAPL',
      trans_code: 'Buy',
      quantity: 10,
      price: 150.0,
      amount: -1500.0,
      description: 'Market Buy'
    },
    {
      process_date: '3/16/2024',
      activity_date: '3/16/2024',
      settle_date: '3/18/2024',
      symbol: 'GOOGL',
      trans_code: 'Sell',
      quantity: 5,
      price: 200.0,
      amount: 1000.0,
      description: 'Market Sell'
    },
    {
      process_date: '2/28/2024',
      activity_date: '2/28/2024',
      settle_date: '3/1/2024',
      symbol: 'MSFT',
      trans_code: 'Buy',
      quantity: 8,
      price: 300.0,
      amount: -2400.0,
      description: 'Market Buy'
    }
  ];

  describe('constructor', () => {
    it('should create instance with valid month/year format', () => {
      expect(new HoodMonthData('3/2024', sampleData)).toBeTruthy();
      expect(new HoodMonthData('12/2024', sampleData)).toBeTruthy();
      expect(new HoodMonthData('01/2024', sampleData).getMonthYear()).toBe('1/2024');
    });

    it('should throw error for invalid month/year formats', () => {
      const invalidFormats = [
        '13/2024',
        '0/2024',
        '1/24',
        '1-2024',
        'abc',
        ''
      ];

      invalidFormats.forEach((format) => {
        expect(() => new HoodMonthData(format, sampleData)).toThrow();
      });
    });
  });

  describe('getBuySellTxs', () => {
    const instance = new HoodMonthData('3/2024', sampleData);

    it('should return only current month buy/sell transactions', () => {
      const txs = instance.getBuySellTxs();
      expect(txs).toHaveLength(2);
      expect(txs.map((tx) => tx.symbol)).toEqual(['AAPL', 'GOOGL']);
    });

    it('should exclude transactions from other months', () => {
      const txs = instance.getBuySellTxs();
      expect(txs.find((tx) => tx.symbol === 'MSFT')).toBeUndefined();
    });
  });

  describe('getMetadata', () => {
    const metadataTestData: HoodTradeTy[] = [
      {
        process_date: '3/15/2024',
        activity_date: '3/15/2024',
        settle_date: '3/17/2024',
        symbol: '',
        trans_code: 'GOLD',
        quantity: 0,
        price: 0,
        amount: -5.0,
        description: 'Gold subscription fee'
      },
      {
        process_date: '3/15/2024',
        activity_date: '3/15/2024',
        settle_date: '3/17/2024',
        symbol: 'AAPL',
        trans_code: 'CDIV',
        quantity: 0,
        price: 0,
        amount: 10.5,
        description: 'Dividend payment'
      },
      {
        process_date: '3/16/2024',
        activity_date: '3/16/2024',
        settle_date: '3/18/2024',
        symbol: '',
        trans_code: 'ACH',
        quantity: 0,
        price: 0,
        amount: 1000.0,
        description: 'ACH Deposit'
      },
      {
        process_date: '3/17/2024',
        activity_date: '3/17/2024',
        settle_date: '3/19/2024',
        symbol: '',
        trans_code: 'ACH',
        quantity: 0,
        price: 0,
        amount: -500.0,
        description: 'ACH Withdrawal'
      },
      {
        process_date: '2/28/2024',
        activity_date: '2/28/2024',
        settle_date: '3/1/2024',
        symbol: '',
        trans_code: 'CDIV',
        quantity: 0,
        price: 0,
        amount: 15.0,
        description: 'Dividend payment'
      }
    ];

    const instance = new HoodMonthData('3/2024', metadataTestData);

    it('should correctly aggregate metadata for current month', () => {
      const metadata = instance.getMetadata();
      expect(metadata).toEqual({
        fees: -5.0,
        dividend: 10.5,
        deposit: 1000.0,
        withdrawal: -500.0,
        interest: 0,
        benefit: 0,
        acats: 0
      });
    });

    it('should handle multiple transactions of the same type', () => {
      const multipleData = [
        ...metadataTestData,
        {
          process_date: '3/18/2024',
          activity_date: '3/18/2024',
          settle_date: '3/20/2024',
          symbol: '',
          trans_code: 'GOLD',
          quantity: 0,
          price: 0,
          amount: -5.0,
          description: 'Another fee'
        }
      ];
      const instanceWithMultiple = new HoodMonthData('3/2024', multipleData);
      const metadata = instanceWithMultiple.getMetadata();
      expect(metadata.fees).toBe(-10.0);
    });
  });
});
