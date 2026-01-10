import { HoodQueue } from './hood-queue';

export default class Validator {
  static verifySell(queue: HoodQueue, symbol: string, qty: number): string | null {
    if (queue.isEmpty(symbol))
      return `You are trying to sell ${qty} ${symbol} that has not been bought yet.`;
    const totalQty: number = queue.getQty(symbol);
    if (totalQty < qty)
      return `Symbol: ${symbol}. Qty: ${qty}. You are trying to sell more than you have.`;
    return null;
  }
}
