import { HoodTradeTy, MetaDataTy } from '../types';
import { dateToMonthYear, formatToUSD, normalizeMonthYear, numberToMonth } from './utils';
import { printBuySellTable, printMonthHeadline, printRow } from './print';

export class HoodMonthData {
  monthYear: string;
  /**
   * Contains both current month data and previous months' data.
   * Previous months' data is needed to calculate profit/loss
   * when trades span multiple months.
   */
  data: HoodTradeTy[];

  constructor(monthYear: string, data: HoodTradeTy[]) {
    this.monthYear = normalizeMonthYear(monthYear);
    this.data = data;
  }

  getMonthYear(): string {
    return this.monthYear;
  }

  getData(): HoodTradeTy[] {
    return this.data;
  }

  getBuySellTxs(): HoodTradeTy[] {
    return this.data.filter(
      (row) =>
        this.monthYear === dateToMonthYear(row.processDate) &&
        (row.transCode === 'Sell' || row.transCode === 'Buy')
    );
  }

  getMetadata(): MetaDataTy {
    const md: MetaDataTy = {
      fees: 0,
      dividend: 0,
      deposit: 0,
      withdrawal: 0,
      interest: 0,
      benefit: 0,
      acats: 0
    };
    const transCodeMap: { [key: string]: keyof typeof md } = {
      GOLD: 'fees',
      MINT: 'fees',
      CDIV: 'dividend',
      MDIV: 'dividend',
      INT: 'interest',
      ACATI: 'acats',
      GDBP: 'benefit',
      'T/A': 'benefit'
    };
    this.data.forEach((row: HoodTradeTy) => {
      if (this.monthYear !== dateToMonthYear(row.processDate)) return;
      const property = transCodeMap[row.transCode];
      if (property) {
        md[property] += row.amount;
      } else if (row.transCode === 'ACH') {
        const desc = (row.description || '').toLowerCase();
        if (desc.includes('deposit')) md.deposit += row.amount;
        else if (desc.includes('withdrawal')) md.withdrawal += row.amount;
      }
    });
    return md;
  }

  printMetadata(): void {
    const md: MetaDataTy = this.getMetadata();
    const rows: [string, number][] = [
      ['Dividend', md.dividend],
      ['Interest', md.interest],
      ['Fees', md.fees],
      ['Deposit', md.deposit],
      ['Withdrawal', md.withdrawal],
      ['Benefit', md.benefit],
      ['ACATS Transfer', md.acats]
    ];
    const hasMetadata = rows.some(([, amount]) => amount !== 0);
    if (!hasMetadata) return;

    rows.forEach(([label, amount]) => {
      if (amount) printRow(label, formatToUSD(amount), { useDots: true });
    });
    console.log('');
  }

  printBuySellTxs(): void {
    const txs: HoodTradeTy[] = this.getBuySellTxs();
    if (!txs.length) return;
    printBuySellTable([...txs].reverse());
  }

  printHeadline(): void {
    const d = this.monthYear.split('/');
    printMonthHeadline(`${numberToMonth(Number(d[0]))} ${d[1]} Monthly Statement`);
  }
}
