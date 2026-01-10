import { LinkedList } from 'typescript-ds-lib';
import { HoodTradeTy } from '../types';

type HoodQueueData = { [key: string]: LinkedList<HoodTradeTy> };

export interface HoodQueue {
  push(symbol: string, trade: HoodTradeTy): void;
  pop(symbol: string): HoodTradeTy | undefined;
  front(symbol: string): HoodTradeTy | undefined;
  getData(): HoodQueueData;
  forEach(callback: (symbol: string, list: LinkedList<HoodTradeTy>) => void): void;
  getQty(symbol: string): number;
  size(): number;
  isEmpty(symbol: string): boolean;
}

export class HoodQueue implements HoodQueue {
  private data: HoodQueueData = {};

  push(symbol: string, trade: HoodTradeTy): void {
    if (!this.data[symbol]) this.data[symbol] = new LinkedList<HoodTradeTy>();
    this.data[symbol].pushBack(trade);
  }

  pop(symbol: string): HoodTradeTy | undefined {
    const list: LinkedList<HoodTradeTy> | undefined = this.data[symbol];
    if (!list) return undefined;
    return list.popFront();
  }

  front(symbol: string): HoodTradeTy | undefined {
    const list: LinkedList<HoodTradeTy> | undefined = this.data[symbol];
    if (!list) return undefined;
    return list.front();
  }

  getData(): HoodQueueData {
    return this.data;
  }

  forEach(callback: (symbol: string, list: LinkedList<HoodTradeTy>) => void): void {
    Object.entries(this.data).forEach(([symbol, list]) => callback(symbol, list));
  }

  getQty(symbol: string): number {
    const list: LinkedList<HoodTradeTy> | undefined = this.data[symbol];
    if (!list) return 0;
    let total: number = 0;
    list.forEach((trade: HoodTradeTy) => {
      total += trade.quantity;
    });
    return total;
  }

  size(): number {
    return Object.keys(this.data).length;
  }

  isEmpty(symbol: string): boolean {
    const list: LinkedList<HoodTradeTy> | undefined = this.data[symbol];
    if (!list) return true;
    return list.isEmpty();
  }
}
