import { HoodTradeTy } from '../types';
import { round, pctChange } from './utils';


export interface ClosingTrade {
  symbol: string;
  buy_qty: number;
  sell_qty: number;
  buy_process_date: string;
  sell_process_date: string;
  buy_price: number;
  sell_price: number;
  profit: number;
  profit_pct: number;

  getHoldingTimeMs(): number;
  getProfit(): number;
  getProfitPct(): number;
  getSymbol(): string;
  getInvestment(): number;
  getData(): ClosingTrade;
};


export class ClosingTrade implements ClosingTrade {
  symbol: string;
  buy_qty: number;
  sell_qty: number;
  buy_process_date: string;
  sell_process_date: string;
  buy_price: number;
  sell_price: number;
  profit: number;
  profit_pct: number;

  constructor(buyTrade: HoodTradeTy, sellTrade: HoodTradeTy) {
    const buyValue: number = buyTrade.price * buyTrade.quantity;
    const sellValue: number = sellTrade.price * sellTrade.quantity;
    this.symbol = buyTrade.symbol;
    this.buy_qty = buyTrade.quantity;
    this.sell_qty = sellTrade.quantity;
    this.buy_process_date = buyTrade.process_date;
    this.sell_process_date = sellTrade.process_date;
    this.buy_price = buyTrade.price;
    this.sell_price = sellTrade.price;
    this.profit = round(sellValue - buyValue);
    this.profit_pct = pctChange(sellValue, buyValue);
  }

  getHoldingTimeMs(): number {
    const buyDate = new Date(this.buy_process_date);
    const sellDate = new Date(this.sell_process_date);
    return sellDate.getTime() - buyDate.getTime();
  }

  getProfit(): number {
    return this.profit;
  }

  getSymbol(): string {
    return this.symbol;
  }

  getInvestment(): number {
    return this.buy_price * this.buy_qty;
  }

  getData(): ClosingTrade {
    return this;
  }

  getProfitPct(): number {
    return this.profit_pct;
  }
}
