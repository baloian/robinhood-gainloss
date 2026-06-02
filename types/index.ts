export interface HoodTradeTy {
  activityDate: string;
  processDate: string;
  settleDate: string;
  symbol: string;
  description: string;
  transCode: string;
  quantity: number;
  price: number;
  amount: number;
};


export interface SymbolProfitTy {
  symbol: string;
  totalProfit: number;
  totalProfitPct: number;
};


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
