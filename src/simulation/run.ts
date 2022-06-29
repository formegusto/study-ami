import _ from "lodash";
import Simulation from ".";
import { TradeResult } from "../types";
import { GetTradeResult } from "../utils";
import BuyerSelectionByListIdx from "./BuyerSelectionByListIdx";

export default function run(this: Simulation) {
  const resultList: TradeResult[] = [];
  let sumOfSupplyKWH = 0;
  let usageBorder = 0;

  // Set usageBorder
  if (this.targetDate.getMonth() === 6 || this.targetDate.getMonth() === 7)
    usageBorder = 300;
  else usageBorder = 200;

  // Set sumOfSupplyKWH : 거래가 가능한 사용량 액수
  const _filtered = _.filter(
    this.orgMeterList,
    (meter) => meter.kwh < usageBorder
  );
  sumOfSupplyKWH = _.sumBy(_filtered, (meter) => usageBorder - meter.kwh);

  // Copy MeterList
  this.currentMeterList = this.orgMeterList.map((meter) => _.cloneDeep(meter));

  while (sumOfSupplyKWH > 0) {
    const tmpTradeUnit =
      sumOfSupplyKWH - this.unitKWHforTrade < 0
        ? sumOfSupplyKWH
        : this.unitKWHforTrade;

    const buyerIdx = BuyerSelectionByListIdx.apply(this, [tmpTradeUnit]);
    const buyer = this.currentMeterList[buyerIdx];
    const result: TradeResult = GetTradeResult(
      buyer,
      this.targetDate,
      buyerIdx,
      tmpTradeUnit
    );
    resultList.push(result);

    this.currentMeterList[buyerIdx].kwh -= this.unitKWHforTrade;
    sumOfSupplyKWH -= this.unitKWHforTrade;
  }

  this.resultList = resultList;
}
