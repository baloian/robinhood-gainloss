import * as path from 'path';
import { deepCopy } from './utils';
import Validator from './validator';
import Parser from './parser';
import { HoodTradeTy, SymbolProfitTy, GainLossTy } from '../types';
import {
  calculateSymbolProfits,
  calculateTotalGainLoss,
  getOrderedHoodMonthsData,
  dateToMonthYear,
  round,
  isQtyZero,
  isQtyGreater,
  isQtyGreaterOrEqual,
  quantitiesEqual
} from './utils';
import { printHoldings, printGainLoss } from './print';
import { HoodMonthData } from './hood-month-data';
import { HoodQueue } from './hood-queue';
import { ClosingTrade } from './closing-trade';

const UNHANDLED_TRANS_CODES = new Set([
  'Buy',
  'Sell',
  '',
  'GOLD',
  'MINT',
  'CDIV',
  'MDIV',
  'INT',
  'ACATI',
  'GDBP',
  'T/A',
  'ACH'
]);

export default class RobinhoodGainLoss {
  private hoodQueue: HoodQueue = new HoodQueue();
  private txsData: ClosingTrade[] = [];
  private readonly inputDir: string;
  private warnedTransCodes = new Set<string>();
  private statementMonthYear: string = '';
  private warnedUnmatchedSells = new Set<string>();

  constructor(inputDir?: string) {
    this.inputDir = inputDir ?? path.resolve(__dirname, '../../input');
  }

  async run(): Promise<void> {
    const rows: HoodTradeTy[] = await Parser.getRawData(this.inputDir);
    this.processMonthlyStmts(rows);
  }

  private processMonthlyStmts(rows: HoodTradeTy[]): void {
    const hoodMonthsData: HoodMonthData[] = getOrderedHoodMonthsData(rows);
    hoodMonthsData.forEach((monthData: HoodMonthData) => {
      this.reset();
      this.statementMonthYear = monthData.getMonthYear();
      monthData.printHeadline();
      monthData.printBuySellTxs();
      monthData.printMetadata();
      this.processTrades(deepCopy(monthData.getData()));
      printHoldings(this.hoodQueue);
      this.reset();
      this.processTrades(deepCopy(monthData.getData()));
      const symbolProfits: SymbolProfitTy[] = calculateSymbolProfits(
        this.txsData,
        monthData.getMonthYear()
      );
      const totalGainLoss: GainLossTy = calculateTotalGainLoss(
        this.txsData,
        monthData.getMonthYear()
      );
      printGainLoss(symbolProfits, totalGainLoss);
      console.log('\n');
    });
  }

  private processTrades(rows: HoodTradeTy[]): void {
    rows.forEach((trade) => {
      switch (trade.transCode) {
        case 'Buy':
          this.hoodQueue.push(trade.symbol, { ...trade });
          break;
        case 'Sell':
          this.processSellTrade(trade);
          break;
        default:
          this.warnUnhandledTransCode(trade.transCode);
          break;
      }
    });
  }

  private warnUnhandledTransCode(transCode: string): void {
    if (!transCode || UNHANDLED_TRANS_CODES.has(transCode) || this.warnedTransCodes.has(transCode)) {
      return;
    }
    this.warnedTransCodes.add(transCode);
    console.warn(
      `Warning: unsupported trans code "${transCode}" (e.g. splits, options). ` +
        'Buy/Sell FIFO matching may be incorrect for affected symbols.'
    );
  }

  private unmatchedSellKey(sellTrade: HoodTradeTy): string {
    return `${sellTrade.symbol}|${sellTrade.processDate}|${sellTrade.quantity}`;
  }

  private warnUnmatchedSell(sellTrade: HoodTradeTy, message: string): void {
    if (dateToMonthYear(sellTrade.processDate) !== this.statementMonthYear) return;
    const key = this.unmatchedSellKey(sellTrade);
    if (this.warnedUnmatchedSells.has(key)) return;
    this.warnedUnmatchedSells.add(key);
    console.warn(`Warning: ${message}`);
  }

  private processSellTrade(sellTrade: HoodTradeTy): void {
    const v = Validator.verifySell(this.hoodQueue, sellTrade.symbol, sellTrade.quantity);
    if (v) {
      if (this.hoodQueue.isEmpty(sellTrade.symbol)) {
        this.warnUnmatchedSell(sellTrade, v);
        return;
      }
      console.error(v);
      throw new Error(v);
    }
    const buyTrade: HoodTradeTy | undefined = this.hoodQueue.front(sellTrade.symbol);
    if (!buyTrade) return;
    if (
      quantitiesEqual(buyTrade.quantity, sellTrade.quantity) ||
      isQtyGreater(buyTrade.quantity, sellTrade.quantity)
    ) {
      this.sellFullOrPartially(buyTrade, sellTrade);
    } else {
      while (!isQtyZero(sellTrade.quantity)) {
        const tmpBuyTrade: HoodTradeTy | undefined = this.hoodQueue.front(sellTrade.symbol);
        if (tmpBuyTrade) {
          const tmpSellTrade: HoodTradeTy = deepCopy(sellTrade);
          tmpSellTrade.quantity = isQtyGreaterOrEqual(sellTrade.quantity, tmpBuyTrade.quantity)
            ? tmpBuyTrade.quantity
            : sellTrade.quantity;
          tmpSellTrade.amount = round(tmpSellTrade.quantity * tmpSellTrade.price);
          this.sellFullOrPartially(tmpBuyTrade, tmpSellTrade);
          sellTrade.quantity -= tmpSellTrade.quantity;
          sellTrade.amount = round(sellTrade.quantity * sellTrade.price);
        } else {
          console.error(sellTrade);
          throw new Error('Oops! Something went wrong');
        }
      }
    }
  }

  private sellFullOrPartially(buyTrade: HoodTradeTy, sellTrade: HoodTradeTy): void {
    if (quantitiesEqual(buyTrade.quantity, sellTrade.quantity)) {
      this.txsData.push(new ClosingTrade(buyTrade, sellTrade));
      this.hoodQueue.pop(sellTrade.symbol);
    } else if (isQtyGreater(buyTrade.quantity, sellTrade.quantity)) {
      const tmpBuyTrade: HoodTradeTy = deepCopy(buyTrade);
      tmpBuyTrade.quantity = sellTrade.quantity;
      tmpBuyTrade.amount = round(tmpBuyTrade.quantity * tmpBuyTrade.price);
      this.txsData.push(new ClosingTrade(tmpBuyTrade, sellTrade));
      buyTrade.quantity -= sellTrade.quantity;
      buyTrade.amount = round(buyTrade.quantity * buyTrade.price);
    }
  }

  private reset() {
    this.hoodQueue = new HoodQueue();
    this.txsData = [];
    this.warnedUnmatchedSells.clear();
  }
}
