import { AptMeterDataMonth, TradeResult } from "../types";
import GetBuyerProfit from "./GetBuyerProfit";
import { ReactivePriceByTradeQty } from "./ReactivePriceByTradeQty";

export default function GetTradeResult(
  inputMeter: AptMeterDataMonth,
  tradeDate: Date,
  idxNum: number,
  tradeUnit: number
): TradeResult {
  const tradePriceWON: number = ReactivePriceByTradeQty(
    tradeUnit,
    inputMeter.kwh,
    tradeDate
  );
  return new TradeResult(
    idxNum,
    tradeUnit,
    tradePriceWON,
    GetBuyerProfit(tradeDate, inputMeter.kwh, tradeUnit, tradePriceWON)
  );
}
