import { SymbolProfitTy, GainLossTy, HoodTradeTy } from '../types';
import { HoodQueue } from './hood-queue';
import { LinkedList } from 'typescript-ds-lib';
import { formatToUSD, round } from './utils';

const MIN_WIDTH = 72;
const MAX_WIDTH = 100;
const DEFAULT_WIDTH = 80;

export function getOutputWidth(): number {
  const cols = process.stdout.columns;
  if (typeof cols === 'number' && cols >= MIN_WIDTH) {
    return Math.min(MAX_WIDTH, cols);
  }
  return DEFAULT_WIDTH;
}

export function printSection(title: string): void {
  console.log('');
  console.log(title);
  console.log('─'.repeat(Math.min(title.length, getOutputWidth())));
}

export function printMonthHeadline(title: string): void {
  console.log('');
  console.log(title);
  console.log('═'.repeat(Math.min(title.length, getOutputWidth())));
  console.log('');
}

/** @deprecated Use printRow with useDots or printSection instead */
export function printWithDots(value1: string, value2: string, symbol: string = '-'): void {
  printRow(value1, value2, { useDots: true, dotChar: symbol });
}

export function printRow(
  label: string,
  value: string,
  options?: { useDots?: boolean; dotChar?: string; colorAmount?: number }
): void {
  const width = getOutputWidth();
  const dotChar = options?.dotChar ?? '·';
  const displayValue =
    options?.colorAmount !== undefined ? colorize(value, options.colorAmount) : value;

  if (options?.useDots) {
    const gap = Math.max(1, width - label.length - value.length - 2);
    console.log(`${label} ${dotChar.repeat(gap)} ${displayValue}`);
    return;
  }

  const pad = Math.max(1, width - label.length - value.length);
  console.log(`${label}${' '.repeat(pad)}${displayValue}`);
}

type TableAlign = 'left' | 'right';

export function printTable(headers: string[], rows: string[][], aligns?: TableAlign[]): void {
  if (rows.length === 0 && headers.length === 0) return;

  const widths = headers.map((header, i) => {
    const cellLengths = rows.map((row) => (row[i] ?? '').length);
    return Math.max(header.length, ...cellLengths, 4);
  });

  const formatCell = (text: string, col: number): string => {
    const align = aligns?.[col] ?? 'left';
    return align === 'right' ? text.padStart(widths[col]) : text.padEnd(widths[col]);
  };

  console.log(headers.map((h, i) => formatCell(h, i)).join('  '));
  console.log(widths.map((w) => '─'.repeat(w)).join('  '));
  rows.forEach((row) => {
    console.log(row.map((cell, i) => formatCell(cell, i)).join('  '));
  });
}

function colorize(text: string, amount: number): string {
  if (process.env.NO_COLOR || !process.stdout.isTTY) return text;
  if (amount > 0) return `\x1b[32m${text}\x1b[0m`;
  if (amount < 0) return `\x1b[31m${text}\x1b[0m`;
  return text;
}

function formatPercent(pct: number): string {
  return `${round(pct, 2)}%`;
}

function formatQty(qty: number): string {
  return qty.toLocaleString('en-US', { maximumFractionDigits: 4 });
}

export function printHoldings(data: HoodQueue): void {
  if (data.size() === 0) return;
  if (Object.values(data.getData()).every((list: LinkedList<HoodTradeTy>) => list.isEmpty())) return;

  const symbols: string[] = [];
  data.forEach((symbol: string, list: LinkedList<HoodTradeTy>) => {
    if (!list.isEmpty()) symbols.push(symbol);
  });
  symbols.sort((a, b) => a.localeCompare(b));

  printSection('Holdings');
  symbols.forEach((symbol) => {
    printRow(symbol, formatQty(data.getQty(symbol)));
  });
}

export function printGainLoss(data: SymbolProfitTy[], gainLoss: GainLossTy): void {
  const grandTotal = gainLoss.shortTermProfit + gainLoss.longTermProfit;

  printSection('Realized Gain/Loss');
  printRow('Total (short term)', formatToUSD(gainLoss.shortTermProfit), {
    colorAmount: gainLoss.shortTermProfit
  });
  printRow('Total (long term)', formatToUSD(gainLoss.longTermProfit), {
    colorAmount: gainLoss.longTermProfit
  });
  printRow('Total', formatToUSD(grandTotal), { colorAmount: grandTotal });

  const sorted = [...data].sort((a, b) => a.symbol.localeCompare(b.symbol));
  if (sorted.length === 0) return;

  console.log('');
  printSection('Realized Gain/Loss by Symbol');
  printTable(
    ['Symbol', 'Realized', '%'],
    sorted.map((item) => [
      item.symbol,
      formatToUSD(item.totalProfit),
      formatPercent(item.totalProfitPct)
    ]),
    ['left', 'right', 'right']
  );
}

export function printBuySellTable(txs: HoodTradeTy[]): void {
  if (!txs.length) return;

  const rows = txs.map((tx) => [
    tx.processDate,
    tx.symbol,
    tx.transCode === 'Buy' ? 'BUY' : 'SELL',
    formatQty(tx.quantity),
    formatToUSD(tx.price),
    formatToUSD(tx.amount)
  ]);

  printTable(['Trade Date', 'Symbol', 'Side', 'Qty', 'Price', 'Amount'], rows, [
    'left',
    'left',
    'left',
    'right',
    'right',
    'right'
  ]);
  console.log('');
}
