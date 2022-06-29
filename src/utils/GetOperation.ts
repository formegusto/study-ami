import _ from "lodash";
import { AptMeterDataMonth, TradeResult } from "../types";
import { CalculateResdnChargeByMonthHighVolt } from "./";
import { ReactivePriceByTradeQty } from "./ReactivePriceByTradeQty";

export function GetWholeAptCharge(
  targetDate: Date,
  wholeHouseholdUsage: number,
  publicUsage: number,
  numHousehold: number
): number {
  let resultVal: number = 0;
  let avgWholeUsage: number =
    (wholeHouseholdUsage + publicUsage) / numHousehold;
  resultVal =
    CalculateResdnChargeByMonthHighVolt(avgWholeUsage, targetDate, false) *
    numHousehold;

  return resultVal;
}

export function GetWholeHouseholdCharge(
  targetDate: Date,
  inputList: AptMeterDataMonth[]
): number {
  return _.sumBy(inputList, (meter) =>
    CalculateResdnChargeByMonthHighVolt(meter.kwh, targetDate, false)
  );
}

export function GetTradeResult(
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

export function GetBuyerProfit(
  targetDate: Date,
  buyerUsageKWH: number,
  qtyKWH: number,
  price: number
): number {
  const usageAfterTrade: number = buyerUsageKWH - qtyKWH;
  let priceMargin = 0;

  if (
    usageAfterTrade >= 1000 &&
    (targetDate.getMonth() === 6 ||
      targetDate.getMonth() === 7 ||
      targetDate.getMonth() === 11 ||
      targetDate.getMonth() === 0 ||
      targetDate.getMonth() === 1)
  ) {
    // super user - 1000kWh over , winter & summer
    priceMargin = 569.6 - price;
  } else {
    if (targetDate.getMonth() === 6 || targetDate.getMonth() === 7) {
      // summmer
      if (usageAfterTrade > 450) {
        // 450kWh over
        priceMargin = 210.6 - price;
      } else if (usageAfterTrade <= 450 && usageAfterTrade > 300) {
        // 300 ~ 450kWh
        priceMargin = 142.3 - price;
      } // 300kWh under
      else {
        priceMargin = 73.3 - price;
      }
    } // spring, autumn, winter
    else {
      if (usageAfterTrade > 400) {
        // 400kWh over
        priceMargin = 210.6 - price;
      } else if (usageAfterTrade <= 400 && usageAfterTrade > 200) {
        // 200 ~ 400kWh
        priceMargin = 142.3 - price;
      } // 200kWh under
      else {
        priceMargin = 73.3 - price;
      }
    }
  }

  return priceMargin * qtyKWH;
}
