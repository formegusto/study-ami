import Simulation from ".";
import _ from "lodash";
import { AptMeterDataMonth } from "../types";
import { ReactivePriceByTradeQty } from "../utils";

const SELLER_PRICE = 73.3;

export default function BuyerSelectionByListIdx(
  this: Simulation,
  tmpTradeUnit: number
): number {
  const bnfSeller: number[] = _.map(
    this.currentMeterList,
    (meter) =>
      (ReactivePriceByTradeQty(tmpTradeUnit, meter.kwh, this.targetDate) -
        SELLER_PRICE) *
      tmpTradeUnit
  );

  return _.indexOf(bnfSeller, _.max(bnfSeller));
}
