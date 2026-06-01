import path from 'path';
import { HoodTradeTy, GainLossTy, SymbolProfitTy } from '../types';
import { HoodMonthData } from './hood-month-data';
import { ClosingTrade } from './closing-trade';

export const QTY_EPSILON = 1e-8;

export function isQtyZero(qty: number): boolean {
  return Math.abs(qty) < QTY_EPSILON;
}

export function quantitiesEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < QTY_EPSILON;
}

export function isQtyGreater(a: number, b: number): boolean {
  return a - b > QTY_EPSILON;
}

export function isQtyGreaterOrEqual(a: number, b: number): boolean {
  return a - b >= -QTY_EPSILON;
}

// The most common solutions for rounding to a decimal place is to either use
// Number.prototype.toFixed(), or multiply the float by some power of 10 in order
// to leverage Math.round(). Both of these work, except sometimes a decimal of 5
// is rounded down instead of up.
export function round(value: number, decimals: number = 2): number {
  const expStr = `${value}e${decimals}`;
  const roundedExpStr = Math.round(Number(expStr));
  const finalValueStr = `${roundedExpStr}e-${decimals}`;
  return Number(finalValueStr);
}

export function pctChange(newValue: number, oldValue: number): number {
  if (oldValue === 0) throw new Error('Old value cannot be zero.');
  const pctChange: number = ((newValue - oldValue) / Math.abs(oldValue)) * 100;
  return round(pctChange);
}

/**
 * Converts a string value from CSV file format to a number.
 * Supports $123, ($123.45) accounting negatives, and (-$123).
 */
export function convertToNumber(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return NaN;
  const accountingNegative = trimmed.startsWith('(') && trimmed.endsWith(')');
  const cleanedValue = trimmed.replace(/[\$,()]/g, '');
  const num = parseFloat(cleanedValue);
  if (isNaN(num)) return NaN;
  if (accountingNegative && num > 0) return -num;
  return num;
}

/**
 * Parses Robinhood MM/DD/YYYY dates in local calendar time (no locale ambiguity).
 */
export function parseRobinhoodDate(dateString: string): Date {
  const trimmed = dateString.trim();
  const regex = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/(\d{4})$/;
  const match = trimmed.match(regex);
  if (!match) {
    throw new Error(`Invalid date format: ${dateString}. Expected format is MM/DD/YYYY.`);
  }
  const month = Number(match[1]) - 1;
  const day = Number(match[2]);
  const year = Number(match[3]);
  return new Date(year, month, day);
}

/**
 * Long-term capital gain: sell date is strictly after the one-year anniversary of the buy date.
 */
export function isLongTermCapitalGain(buyDateString: string, sellDateString: string): boolean {
  const buyDate = parseRobinhoodDate(buyDateString);
  const sellDate = parseRobinhoodDate(sellDateString);
  const anniversary = new Date(buyDate);
  anniversary.setFullYear(anniversary.getFullYear() + 1);
  return sellDate.getTime() > anniversary.getTime();
}

/**
 * Normalizes MM/YYYY to M/YYYY (no leading zeros on month).
 */
export function normalizeMonthYear(monthYear: string): string {
  const regex = /^(0?[1-9]|1[0-2])\/(\d{4})$/;
  if (!regex.test(monthYear.trim())) {
    throw new Error(`Invalid month/year format: ${monthYear}. Expected format is MM/YYYY.`);
  }
  const [month, year] = monthYear.trim().split('/').map(Number);
  return `${month}/${year}`;
}

export function isMonthYearLessOrEqual(date1: string, date2: string): boolean {
  const m1 = normalizeMonthYear(date1);
  const m2 = normalizeMonthYear(date2);
  const [month1, year1] = m1.split('/').map(Number);
  const [month2, year2] = m2.split('/').map(Number);
  if (year1 !== year2) return year1 <= year2;
  return month1 <= month2;
}

export function csvFileNumericSortKey(filePath: string): number {
  const baseName = path.basename(filePath, path.extname(filePath));
  if (!/^\d+$/.test(baseName)) {
    throw new Error(
      `CSV filename must be a number (e.g. 1.csv), got: ${path.basename(filePath)}`
    );
  }
  return Number(baseName);
}

export function sortCsvFilesByNumericName(filePaths: string[]): string[] {
  return [...filePaths].sort((a, b) => csvFileNumericSortKey(a) - csvFileNumericSortKey(b));
}

export function sortTradesByProcessDate(rows: HoodTradeTy[]): HoodTradeTy[] {
  return [...rows].sort((a, b) => {
    const dateDiff =
      parseRobinhoodDate(a.process_date).getTime() - parseRobinhoodDate(b.process_date).getTime();
    if (dateDiff !== 0) return dateDiff;
    const activityDiff =
      parseRobinhoodDate(a.activity_date || a.process_date).getTime() -
      parseRobinhoodDate(b.activity_date || b.process_date).getTime();
    return activityDiff;
  });
}

/** @deprecated Use sortTradesByProcessDate on a flat merged list. */
export function sortListsByLastProcessDate(lists: HoodTradeTy[][]): HoodTradeTy[] {
  return sortTradesByProcessDate(lists.flat());
}

export function dateToMonthYear(dateString: string): string {
  dateString = dateString.trim();
  const regex = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/;
  if (!regex.test(dateString)) {
    throw new Error(`Invalid date format: ${dateString}. Expected format is MM/DD/YYYY.`);
  }
  const parts: string[] = dateString.split('/');
  return normalizeMonthYear(`${parts[0]}/${parts[2]}`);
}

/**
 * Proportional cash amount for a partial lot (uses CSV amount when present, includes fees).
 */
export function proportionalAmount(trade: HoodTradeTy, qty: number): number {
  if (trade.quantity && !isNaN(trade.amount) && trade.amount !== 0) {
    let amt = round(trade.amount * (qty / trade.quantity));
    // Robinhood uses negative amounts for buys; normalize if CSV has positive cost.
    if (trade.trans_code === 'Buy' && amt > 0) amt = -amt;
    if (trade.trans_code === 'Sell' && amt < 0) amt = -amt;
    return amt;
  }
  const sign = trade.trans_code === 'Buy' ? -1 : 1;
  return round(sign * trade.price * qty);
}

export function validateHoodTrade(row: HoodTradeTy, source: string): void {
  if (row.trans_code !== 'Buy' && row.trans_code !== 'Sell') return;
  if (!row.symbol) {
    throw new Error(`${source}: ${row.trans_code} row is missing symbol (${row.process_date}).`);
  }
  if (isNaN(row.quantity) || row.quantity <= 0) {
    throw new Error(
      `${source}: invalid quantity for ${row.symbol} ${row.trans_code} on ${row.process_date}.`
    );
  }
  if (isNaN(row.price) || row.price < 0) {
    throw new Error(
      `${source}: invalid price for ${row.symbol} ${row.trans_code} on ${row.process_date}.`
    );
  }
}

export function getTradesByMonth(rows: HoodTradeTy[], month: string): HoodTradeTy[] {
  const normalizedMonth = normalizeMonthYear(month);
  return rows.filter(
    (row) =>
      row.process_date &&
      isMonthYearLessOrEqual(dateToMonthYear(row.process_date), normalizedMonth)
  );
}

export function calculateTotalGainLoss(data: ClosingTrade[], monthYear: string): GainLossTy {
  const normalizedMonth = normalizeMonthYear(monthYear);
  const trades = data.filter((d) => dateToMonthYear(d.sell_process_date) === normalizedMonth);
  const profitSummary: GainLossTy = {
    long_term_profit: 0,
    short_term_profit: 0
  };
  trades.forEach((trade: ClosingTrade) => {
    if (trade.isLongTerm()) {
      profitSummary.long_term_profit += trade.profit;
    } else {
      profitSummary.short_term_profit += trade.profit;
    }
  });
  return {
    long_term_profit: round(profitSummary.long_term_profit),
    short_term_profit: round(profitSummary.short_term_profit)
  };
}

export function calculateSymbolProfits(data: ClosingTrade[], monthYear: string): SymbolProfitTy[] {
  const normalizedMonth = normalizeMonthYear(monthYear);
  const trades = data.filter((d) => dateToMonthYear(d.sell_process_date) === normalizedMonth);
  const result: { [key: string]: { total_profit: number; total_investment: number } } = {};
  trades.forEach((trade: ClosingTrade) => {
    const symbol = trade.getSymbol();
    if (!result[symbol]) result[symbol] = { total_profit: 0, total_investment: 0 };
    result[symbol].total_profit += trade.getProfit();
    result[symbol].total_investment += trade.getInvestment();
  });
  return Object.keys(result).map((symbol) => {
    const { total_profit, total_investment } = result[symbol];
    const total_profit_pct =
      total_investment === 0 ? 0 : round((total_profit / total_investment) * 100);
    return {
      symbol,
      total_profit: round(total_profit),
      total_profit_pct
    };
  });
}

export function getOrderedHoodMonthsData(rows: HoodTradeTy[]): HoodMonthData[] {
  const data: HoodMonthData[] = [];
  const monthYearData: { [key: string]: boolean } = {};
  for (const row of rows) {
    const monthYear: string = dateToMonthYear(row.process_date);
    if (!monthYearData[monthYear]) {
      monthYearData[monthYear] = true;
      data.push(new HoodMonthData(monthYear, getTradesByMonth(rows, monthYear)));
    }
  }
  return data.sort((a, b) => {
    const [monthA, yearA] = a.getMonthYear().split('/').map(Number);
    const [monthB, yearB] = b.getMonthYear().split('/').map(Number);
    if (yearA !== yearB) return yearA - yearB;
    return monthA - monthB;
  });
}

export function formatToUSD(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function deepCopy<T>(obj: T): T {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj));
}

export function numberToMonth(month: number): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  return months[month - 1];
}
