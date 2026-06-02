export enum TransCode {
  BUY = 'Buy',
  SELL = 'Sell',
  EMPTY = '',
  GOLD = 'GOLD',
  MINT = 'MINT',
  CDIV = 'CDIV',
  MDIV = 'MDIV',
  INT = 'INT',
  ACATI = 'ACATI',
  GDBP = 'GDBP',
  TA = 'T/A',
  ACH = 'ACH'
}

export type TradeTransCode = TransCode | string;

export interface HoodTradeTy {
  activityDate: string;
  processDate: string;
  settleDate: string;
  symbol: string;
  description: string;
  transCode: TradeTransCode;
  quantity: number;
  price: number;
  amount: number;
}


export interface SymbolProfitTy {
  symbol: string;
  totalProfit: number;
  totalProfitPct: number;
}


export interface MetaDataTy {
  fees: number;
  dividend: number;
  deposit: number;
  withdrawal: number;
  interest: number;
  benefit: number;
  acats: number;
}


export interface GainLossTy {
  longTermProfit: number;
  shortTermProfit: number;
}

export type SymbolProfitAccumulatorTy = Record<
  string,
  {
    totalProfit: number;
    totalInvestment: number;
  }
>;
