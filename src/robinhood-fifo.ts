import * as path from 'path';
import { deepCopy } from './utils';
import Validator from './validator';
import Parser from './parser';
import {
  HoodTradeTy,
  SymbolProfitTy,
  GainLossTy
} from '../types';
import {
  calculateSymbolProfits,
  calculateTotalGainLoss,
  getOrderedHoodMonthsData,
  round
} from './utils';
import {
  printHoldings,
  printGainLoss
} from './print';
import { HoodMonthData } from './hood-month-data';
import { HoodQueue } from './hood-queue';
import { ClosingTrade } from './closing-trade';


export default class RobinhoodFIFO {
  // Queue storing orders for each symbol using FIFO (First In, First Out) order.
  private hoodQueue: HoodQueue = new HoodQueue();
  private txsData: ClosingTrade[] = [];

  async run(): Promise<void> {
    try {
      const rows: HoodTradeTy[] = await Parser.getRawData(path.resolve(__dirname, '../../input'));
      this.processMonthlyStmts(rows);
    } catch (error) {
      console.error(error);
    }
  }

  private processMonthlyStmts(rows: HoodTradeTy[]): void {
    const hoodMonthsData: HoodMonthData[] = getOrderedHoodMonthsData(rows);
    hoodMonthsData.forEach((monthData: HoodMonthData) => {
      this.reset();
      monthData.printHeadline();
      monthData.printBuySellTxs();
      monthData.printMetadata();
      this.processTrades(deepCopy(monthData.getData()));
      printHoldings(this.hoodQueue);
      this.reset();
      this.processTrades(deepCopy(monthData.getData()));
      const symbolProfits: SymbolProfitTy[] = calculateSymbolProfits(this.txsData, monthData.getMonthYear());
      const totalGainLoss: GainLossTy = calculateTotalGainLoss(this.txsData, monthData.getMonthYear());
      printGainLoss(symbolProfits, totalGainLoss);
      console.log('\n\n\n\n\n');
    });
  }

  private processTrades(rows: HoodTradeTy[]): void {
    rows.forEach(trade => {
      switch (trade.trans_code) {
        case 'Buy':
          this.hoodQueue.push(trade.symbol, { ...trade });
          break;
        case 'Sell':
          this.processSellTrade(trade);
          break;
        default:
          break;
      }
    });
  }

  private processSellTrade(sellTrade: HoodTradeTy): void {
    const v = Validator.verifySell(this.hoodQueue, sellTrade.symbol, sellTrade.quantity);
    if (v) return;
    const buyTrade: HoodTradeTy | undefined = this.hoodQueue.front(sellTrade.symbol);
    if (!buyTrade) return;
    if (buyTrade.quantity - sellTrade.quantity === 0 || buyTrade.quantity - sellTrade.quantity > 0) {
      this.sellFullOrPartially(buyTrade, sellTrade);
    } else {
      // This is when selling more than the current buy order.
      // For example, buying 5 APPL, and then buying 4 more APPL, and then selling 7 APPL.
      // In this case, the current buying order is the 5 AAPL. I would need to sell 2 more
      // AAPL from the 4 AAPL buy.
      while (sellTrade.quantity > 0) {
        const tmpBuyTrade: HoodTradeTy | undefined = this.hoodQueue.front(sellTrade.symbol);
        if (tmpBuyTrade) {
          const tmpSellTrade: HoodTradeTy = deepCopy(sellTrade);
          tmpSellTrade.quantity = sellTrade.quantity >= tmpBuyTrade.quantity ?
            tmpBuyTrade.quantity : sellTrade.quantity;
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

  // This is when selling the entire order. For example, buying 5 APPL and then selling 5 APPL.
  // OR when selling less than bought. For example, buying 5 APPL and then selling 3 APPL.
  private sellFullOrPartially(buyTrade: HoodTradeTy, sellTrade: HoodTradeTy): void {
    if (buyTrade.quantity - sellTrade.quantity === 0) {
      this.txsData.push(new ClosingTrade(buyTrade, sellTrade));
      this.hoodQueue.pop(sellTrade.symbol);
    } else if (buyTrade.quantity - sellTrade.quantity > 0) {
      const tmpBuyTrade: HoodTradeTy = deepCopy(buyTrade);
      tmpBuyTrade.quantity = sellTrade.quantity;
      tmpBuyTrade.amount = round(tmpBuyTrade.quantity * tmpBuyTrade.price);
      this.txsData.push(new ClosingTrade(tmpBuyTrade, sellTrade));
      // This would be the remaining part (not sold yet).
      buyTrade.quantity -= sellTrade.quantity;
      buyTrade.amount = round(buyTrade.quantity * buyTrade.price);
    }
  }

  private reset() {
    this.hoodQueue = new HoodQueue();
    this.txsData = [];
  }
}

