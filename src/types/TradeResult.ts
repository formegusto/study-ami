export class TradeResult {
  householdIndex: number;
  tradeQtyKWH: number;
  tradePriceWON: number;
  buyerProfit: number;

  constructor(
    householdIdx: number,
    tradeQtyKWH: number,
    tradePriceWON: number,
    buyerProfit: number
  ) {
    this.householdIndex = householdIdx;
    this.tradeQtyKWH = tradeQtyKWH;
    this.tradePriceWON = tradePriceWON;
    this.buyerProfit = buyerProfit;
  }
}
