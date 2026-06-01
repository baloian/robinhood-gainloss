import { HoodTradeTy } from '../types';
import {
  round,
  pctChange,
  proportionalAmount,
  isLongTermCapitalGain,
  parseRobinhoodDate
} from './utils';

export interface ClosingTrade {
  symbol: string;
  buy_qty: number;
  sell_qty: number;
  buy_process_date: string;
  sell_process_date: string;
  buy_activity_date: string;
  sell_activity_date: string;
  buy_price: number;
  sell_price: number;
  profit: number;
  profit_pct: number;
  investment: number;

  isLongTerm(): boolean;
  getHoldingTimeMs(): number;
  getProfit(): number;
  getProfitPct(): number;
  getSymbol(): string;
  getInvestment(): number;
  getData(): ClosingTrade;
}

export class ClosingTrade implements ClosingTrade {
  symbol: string;
  buy_qty: number;
  sell_qty: number;
  buy_process_date: string;
  sell_process_date: string;
  buy_activity_date: string;
  sell_activity_date: string;
  buy_price: number;
  sell_price: number;
  profit: number;
  profit_pct: number;
  investment: number;

  constructor(buyTrade: HoodTradeTy, sellTrade: HoodTradeTy) {
    const matchedQty = sellTrade.quantity;
    const buyAmt = proportionalAmount(buyTrade, matchedQty);
    const sellAmt = proportionalAmount(sellTrade, matchedQty);
    const buyValue = Math.abs(buyAmt);
    const sellValue = Math.abs(sellAmt);

    this.symbol = buyTrade.symbol;
    this.buy_qty = matchedQty;
    this.sell_qty = matchedQty;
    this.buy_process_date = buyTrade.process_date;
    this.sell_process_date = sellTrade.process_date;
    this.buy_activity_date = buyTrade.activity_date || buyTrade.process_date;
    this.sell_activity_date = sellTrade.activity_date || sellTrade.process_date;
    this.buy_price = buyTrade.price;
    this.sell_price = sellTrade.price;
    this.profit = round(sellAmt + buyAmt);
    this.investment = buyValue;
    this.profit_pct = buyValue === 0 ? 0 : pctChange(sellValue, buyValue);
  }

  isLongTerm(): boolean {
    return isLongTermCapitalGain(this.buy_activity_date, this.sell_activity_date);
  }

  getHoldingTimeMs(): number {
    const buyDate = parseRobinhoodDate(this.buy_activity_date);
    const sellDate = parseRobinhoodDate(this.sell_activity_date);
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
    return this.profit_pct;
  }
}
