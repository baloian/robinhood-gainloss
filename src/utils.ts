import { round } from '@baloian/lib-ts';
import {
  HoodTradeTy,
  GainLossTy,
  SymbolProfitTy
} from '../types';
import { HoodMonthData } from './hood-month-data';
import { ClosingTrade } from './closing-trade';


/**
 * Converts a string value from CSV file format ($NUMBER) to the numberic value.
 * CSV files contain currency values with dollar signs and parentheses.
 * e.g. ($123.45) to $123.45.
 */
export function convertToNumber(value: string): number {
  const cleanedValue = value.replace(/[\$,()]/g, '');
  return parseFloat(cleanedValue);
}


/**
 * Compares two dates in MM/YYYY format and determines if the first date is less than or equal to the second date.
 * date1 - First date in MM/YYYY format (e.g., "03/2024")
 * date2 - Second date in MM/YYYY format (e.g., "04/2024")
 * Returns True if date1 is less than or equal to date2, false otherwise.
 * Throws Error if dates are not in valid MM/YYYY format.
 */
export function isMonthYearLessOrEqual(date1: string, date2: string): boolean {
  const regex = /^(0?[1-9]|1[0-2])\/\d{4}$/;
  if (!regex.test(date1) || !regex.test(date2)) {
    throw new Error('Invalid date format. Expected format is MM/YYYY');
  }
  const [month1, year1] = date1.split('/').map(Number);
  const [month2, year2] = date2.split('/').map(Number);
  if (year1 !== year2) return year1 <= year2;
  return month1 <= month2;
}


/**
 * When processing multiple CSV files, this function ensures that data is ordered based on process date.
 * This is crucial for maintaining the correct activity order across all input files.
 */
export function sortListsByLastProcessDate(lists: HoodTradeTy[][]): HoodTradeTy[] {
  const sortedLists: HoodTradeTy[][] = lists
    .filter(subList => subList.length > 0)
    .sort((a, b) => {
      const dateA = new Date(a[a.length - 1].process_date).getTime();
      const dateB = new Date(b[b.length - 1].process_date).getTime();
      return dateA - dateB;
    });
  return sortedLists.flatMap(subList => subList);
}


export function dateToMonthYear(dateString: string): string {
  // Regular expression to match MM/DD/YYYY format
  dateString = dateString.trim();
  const regex = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/;
  if (!regex.test(dateString)) {
    throw new Error(`Invalid date format: ${dateString}. Expected format is MM/DD/YYYY.`);
  }
  const parts: string[] = dateString.split('/');
  return `${parts[0]}/${parts[2]}`;
}


export function getTradesByMonth(rows: HoodTradeTy [], month: string): HoodTradeTy [] {
  return rows.filter(row =>
    row.process_date &&
    isMonthYearLessOrEqual(dateToMonthYear(row.process_date), month));
}


export function calculateTotalGainLoss(data: ClosingTrade[], monthYear: string): GainLossTy {
  const trades = data.filter(d => dateToMonthYear(d.sell_process_date) === monthYear);
  const profitSummary: GainLossTy = {
    long_term_profit: 0,
    short_term_profit: 0
  };
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const DAYS_PER_YEAR = 365;
  const ONE_YEAR_MS = DAYS_PER_YEAR * MS_PER_DAY;
  trades.forEach((trade: ClosingTrade) => {
    if (trade.getHoldingTimeMs() > ONE_YEAR_MS) {
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
  const trades = data.filter(d => dateToMonthYear(d.sell_process_date) === monthYear);
  const result: {[key: string]: {total_profit: number; total_profit_pct: number}} = {};
  trades.forEach((trade: ClosingTrade) => {
    const investment = trade.getInvestment();
    if (!result[trade.getSymbol()]) result[trade.getSymbol()] = {total_profit: 0, total_profit_pct: 0};
    const symbolData = result[trade.getSymbol()];
    symbolData.total_profit += trade.getProfit();
    const totalInvestment = (symbolData.total_profit_pct * symbolData.total_profit) + investment;
    symbolData.total_profit_pct = (
      (symbolData.total_profit_pct * (totalInvestment - investment)) +
      (trade.getProfitPct() * investment)
    ) / totalInvestment;
  });
  return Object.keys(result).map(symbol => ({
    symbol: symbol,
    total_profit: round(result[symbol].total_profit),
    total_profit_pct: round(result[symbol].total_profit_pct)
  }));
}


export function getOrderedHoodMonthsData(rows: HoodTradeTy []): HoodMonthData[] {
  const data: HoodMonthData[] = [];
  const monthYearData: {[key: string]: boolean} = {};
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


// Convert a number to a USD dollar value. For example,
// formatToUSD(123459.87) -> $123,458.87
export function formatToUSD(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}


// This method is simple and works well for plain objects that do not contain
// functions or special types like Date, Set, Map,...
export function deepCopy<T>(obj: T): T {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj));
}

export function numberToMonth(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
}
