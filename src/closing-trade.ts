import { HoodTradeTy } from '../types';
import {
  round,
  pctChange,
  proportionalAmount,
  isLongTermCapitalGain,
  parseRobinhoodDate
} from './utils';

export class ClosingTrade {
  symbol: string;
  buyQty: number;
  sellQty: number;
  buyProcessDate: string;
  sellProcessDate: string;
  buyActivityDate: string;
  sellActivityDate: string;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  profitPct: number;
  investment: number;

  constructor(buyTrade: HoodTradeTy, sellTrade: HoodTradeTy) {
    const matchedQty = sellTrade.quantity;
    const buyAmt = proportionalAmount(buyTrade, matchedQty);
    const sellAmt = proportionalAmount(sellTrade, matchedQty);
    const buyValue = Math.abs(buyAmt);
    const sellValue = Math.abs(sellAmt);

    this.symbol = buyTrade.symbol;
    this.buyQty = matchedQty;
    this.sellQty = matchedQty;
    this.buyProcessDate = buyTrade.process_date;
    this.sellProcessDate = sellTrade.process_date;
    this.buyActivityDate = buyTrade.activity_date || buyTrade.process_date;
    this.sellActivityDate = sellTrade.activity_date || sellTrade.process_date;
    this.buyPrice = buyTrade.price;
    this.sellPrice = sellTrade.price;
    this.profit = round(sellAmt + buyAmt);
    this.investment = buyValue;
    this.profitPct = buyValue === 0 ? 0 : pctChange(sellValue, buyValue);
  }

  isLongTerm(): boolean {
    return isLongTermCapitalGain(this.buyActivityDate, this.sellActivityDate);
  }

  getHoldingTimeMs(): number {
    const buyDate = parseRobinhoodDate(this.buyActivityDate);
    const sellDate = parseRobinhoodDate(this.sellActivityDate);
    return sellDate.getTime() - buyDate.getTime();
  }

  getProfit(): number {
    return this.profit;
  }

  getSymbol(): string {
    return this.symbol;
  }

  getInvestment(): number {
    return this.investment;
  }

  getData(): ClosingTrade {
    return this;
  }

  getProfitPct(): number {
    return this.profitPct;
  }
}
