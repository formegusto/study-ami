import { AptMeterDataMonth } from "../types";
import { readCsv } from "../utils";
import BuyerSelectionByListIdx from "./BuyerSelectionByListIdx";
import _ from "lodash";

class Simulation {
  orgMeterList: AptMeterDataMonth[];
  currentMeterList?: AptMeterDataMonth[];
  targetDate: Date;
  unitKWHforTrade: number;

  constructor(filePath: string) {
    const csvLines = readCsv(filePath);
    this.orgMeterList = csvLines.map(
      (csvLine) => new AptMeterDataMonth(csvLine.split(","))
    );
    this.targetDate = new Date(2018, 8, 31);
    this.unitKWHforTrade = 5;
    console.log(
      "[Simulation Obj] #01 Constructor : MeterList, TargetDate, unitKWHforTrade Initializing Okay :)"
    );
  }

  run() {
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
    sumOfSupplyKWH = _.sumBy(_filtered, (meter) => meter.kwh);

    // Copy MeterList
    this.currentMeterList = this.orgMeterList.map((meter) =>
      _.cloneDeep(meter)
    );

    BuyerSelectionByListIdx.apply(this);
  }
}

export default Simulation;
