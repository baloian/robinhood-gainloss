import { HoodTradeTy, MetaDataTy } from '../types';
import { dateToMonthYear, formatToUSD, numberToMonth } from './utils';
import { printWithDots } from './print';


export interface HoodMonthData {
  monthYear: string;
  data: HoodTradeTy[];

  getMonthYear(): string;
  getData(): HoodTradeTy[];
  getMetadata(): MetaDataTy;
  printMetadata(): void;
  getBuySellTxs(): HoodTradeTy[];
  printBuySellTxs(): void;
  printHeadline(): void;
}


export class HoodMonthData implements HoodMonthData {
  monthYear: string;
  /** 
   * Contains both current month data and previous months' data.
   * Previous months' data is needed to calculate profit/loss
   * when trades span multiple months.
   */
  data: HoodTradeTy[];

  constructor(monthYear: string, data: HoodTradeTy[]) {
    const regex = /^([1-9]|1[0-2])\/\d{4}$/;
    if (!regex.test(monthYear)) {
      throw new Error(`Invalid month/year format: ${monthYear}. Expected format is MM/YYYY.`);
    }
    this.monthYear = monthYear;
    this.data = data;
  }

  getMonthYear(): string {
    return this.monthYear;
  }

  getData(): HoodTradeTy[] {
    return this.data;
  }

  getBuySellTxs(): HoodTradeTy[] {
    return this.data.filter(row =>
      this.monthYear === dateToMonthYear(row.process_date) &&
      (row.trans_code === 'Sell' || row.trans_code === 'Buy'));
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
      ACATI: 'acats',
      GDBP: 'benefit',
      'T/A': 'benefit'
    };
    this.data.forEach((row: HoodTradeTy) => {
      if (this.monthYear !== dateToMonthYear(row.process_date)) return;
      const property = transCodeMap[row.trans_code];
      if (property) {
        md[property] += row.amount;
      } else if (row.trans_code === 'ACH') {
        if (row.description === 'ACH Deposit') md.deposit += row.amount;
        if (row.description === 'ACH Withdrawal') md.withdrawal += row.amount;
      }
    })
    return md;
  }

  printMetadata(): void {
    const md: MetaDataTy = this.getMetadata();
    if (md.dividend) printWithDots('Dividend', `${formatToUSD(md.dividend)}`);
    if (md.interest) printWithDots('Interest', `${formatToUSD(md.interest)}`);
    if (md.fees) printWithDots('Fees', `${formatToUSD(md.fees)}`);
    if (md.deposit) printWithDots('Deposit', `${formatToUSD(md.deposit)}`);
    if (md.withdrawal) printWithDots('Withdrawal', `${formatToUSD(md.withdrawal)}`);
    if (md.benefit) printWithDots('Benefit', `${formatToUSD(md.benefit)}`);
    if (md.acats) printWithDots('ACATS Transfer', `${formatToUSD(md.acats)}`);
    console.log('');
  }

  printBuySellTxs(): void {
    const txs: HoodTradeTy[] = this.getBuySellTxs();
    if (!txs.length) return;
    const headers = ['Trade Date', 'Symbol', 'Side', 'Qty', 'Price', 'Amount'];
    const headerRow = headers.map(header => header.padEnd(10)).join(' | ');
    const separator = headers.map(() => '----------').join('-|-');

    console.log(headerRow);
    console.log(separator);

    txs.reverse().forEach(tx => {
      const rowString = [
        tx.process_date.padEnd(10),
        tx.symbol.padEnd(10),
        (tx.trans_code === 'Buy' ? 'BUY' : 'SELL').padEnd(10),
        tx.quantity.toString().padEnd(10),
        formatToUSD(tx.price).padEnd(10),
        formatToUSD(tx.amount).padEnd(10)
      ].join(' | ');
      console.log(rowString);
    });
    console.log('\n');
  }

  printHeadline(): void {
    const d = this.monthYear.split('/');
    printWithDots(`### ${numberToMonth(Number(d[0]))} ${d[1]} Monthly Statement`, '', '#');
    console.log('');
  }
}
