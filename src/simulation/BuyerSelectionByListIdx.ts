import Simulation from ".";
import _ from "lodash";
import { ReactivePriceByTradeQty } from "../utils";

const SELLER_PRICE = 73.3;

export default function BuyerSelectionByListIdx(
  this: Simulation,
  tmpTradeUnit: number
): number {
  // ReactivePriceByTrade Qty : 수요함수에 의해 거래수량에 대한 1kWh당 선호 가격을 구한 후
  // 판매자의 가격, 누진 1단계의 가격을 빼준다.
  // 그리고 실제 거래수량을 곱해서 총 거래액수를 선정한다.
  const bnfSeller: number[] = _.map(
    this.currentMeterList,
    (meter) =>
      (ReactivePriceByTradeQty(tmpTradeUnit, meter.kwh, this.targetDate) -
        SELLER_PRICE) *
      tmpTradeUnit
  );

  // console.log(_.maxBy(this.currentMeterList, (meter) => meter.kwh));
  // 이 후 가장 거래액수가 높은 가구의 순번을 반환한다.
  return _.indexOf(bnfSeller, _.max(bnfSeller));
}
