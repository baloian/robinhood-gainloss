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
    throw new Error(`CSV filename must be a number (e.g. 1.csv), got: ${path.basename(filePath)}`);
  }
  return Number(baseName);
}

export function sortCsvFilesByNumericName(filePaths: string[]): string[] {
  return [...filePaths].sort((a, b) => csvFileNumericSortKey(a) - csvFileNumericSortKey(b));
}

/** Trade date used for FIFO ordering (Activity Date when present, else Process Date). */
export function effectiveTradeDate(trade: HoodTradeTy): Date {
  const activity = (trade.activityDate || '').trim();
  if (activity) return parseRobinhoodDate(activity);
  return parseRobinhoodDate(trade.processDate);
}

/**
 * Sort trades for FIFO processing by activity (trade) date. On the same trade day,
 * buys are ordered before sells so Robinhood CSV row order (often newest-first within
 * a month) does not run sells before same-day purchases. When trade dates tie,
 * original CSV order is preserved (stable sort).
 */
export function sortTradesByProcessDate(rows: HoodTradeTy[]): HoodTradeTy[] {
  return [...rows].sort((a, b) => {
    const activityDiff = effectiveTradeDate(a).getTime() - effectiveTradeDate(b).getTime();
    if (activityDiff !== 0) return activityDiff;
    if (a.transCode === 'Buy' && b.transCode === 'Sell') return -1;
    if (a.transCode === 'Sell' && b.transCode === 'Buy') return 1;
    return 0;
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
    if (trade.transCode === 'Buy' && amt > 0) amt = -amt;
    if (trade.transCode === 'Sell' && amt < 0) amt = -amt;
    return amt;
  }
  const sign = trade.transCode === 'Buy' ? -1 : 1;
  return round(sign * trade.price * qty);
}

export function validateHoodTrade(row: HoodTradeTy, source: string): void {
  if (row.transCode !== 'Buy' && row.transCode !== 'Sell') return;
  if (!row.symbol) {
    throw new Error(`${source}: ${row.transCode} row is missing symbol (${row.processDate}).`);
  }
  if (isNaN(row.quantity) || row.quantity <= 0) {
    throw new Error(
      `${source}: invalid quantity for ${row.symbol} ${row.transCode} on ${row.processDate}.`
    );
  }
  if (isNaN(row.price) || row.price < 0) {
    throw new Error(
      `${source}: invalid price for ${row.symbol} ${row.transCode} on ${row.processDate}.`
    );
  }
}

export function getTradesByMonth(rows: HoodTradeTy[], month: string): HoodTradeTy[] {
  const normalizedMonth = normalizeMonthYear(month);
  return rows.filter(
    (row) =>
      row.processDate && isMonthYearLessOrEqual(dateToMonthYear(row.processDate), normalizedMonth)
  );
}

export function calculateTotalGainLoss(data: ClosingTrade[], monthYear: string): GainLossTy {
  const normalizedMonth = normalizeMonthYear(monthYear);
  const trades = data.filter((d) => dateToMonthYear(d.sellProcessDate) === normalizedMonth);
  const profitSummary: GainLossTy = {
    longTermProfit: 0,
    shortTermProfit: 0
  };
  trades.forEach((trade: ClosingTrade) => {
    if (trade.isLongTerm()) {
      profitSummary.longTermProfit += trade.profit;
    } else {
      profitSummary.shortTermProfit += trade.profit;
    }
  });
  return {
    longTermProfit: round(profitSummary.longTermProfit),
    shortTermProfit: round(profitSummary.shortTermProfit)
  };
}

export function calculateSymbolProfits(data: ClosingTrade[], monthYear: string): SymbolProfitTy[] {
  const normalizedMonth = normalizeMonthYear(monthYear);
  const trades = data.filter((d) => dateToMonthYear(d.sellProcessDate) === normalizedMonth);
  const result: { [key: string]: { totalProfit: number; totalInvestment: number } } = {};
  trades.forEach((trade: ClosingTrade) => {
    const symbol = trade.getSymbol();
    if (!result[symbol]) result[symbol] = { totalProfit: 0, totalInvestment: 0 };
    result[symbol].totalProfit += trade.getProfit();
    result[symbol].totalInvestment += trade.getInvestment();
  });
  return Object.keys(result).map((symbol) => {
    const { totalProfit, totalInvestment } = result[symbol];
    const totalProfitPct = totalInvestment === 0 ? 0 : round((totalProfit / totalInvestment) * 100);
    return {
      symbol,
      totalProfit: round(totalProfit),
      totalProfitPct: round(totalProfitPct)
    };
  });
}

export function getOrderedHoodMonthsData(rows: HoodTradeTy[]): HoodMonthData[] {
  const data: HoodMonthData[] = [];
  const monthYearData: { [key: string]: boolean } = {};
  for (const row of rows) {
    const monthYear: string = dateToMonthYear(row.processDate);
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
