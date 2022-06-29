import { AptMeterDataMonth, SettlementInfo, TradeResult } from "../types";
import { readCsv } from "../utils";
import _ from "lodash";
import run from "./run";
import GetSettlementInfos from "./GetSettlementInfos";

class Simulation {
  orgMeterList: AptMeterDataMonth[];
  currentMeterList?: AptMeterDataMonth[];
  targetDate: Date;
  unitKWHforTrade: number;
  resultList?: TradeResult[];
  settleMentList?: SettlementInfo[];

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
    run.apply(this);

    console.log("[Simulation Obj] #02 Run Simulation Successful :)");
    console.log(`length : ${this.resultList?.length}`);
  }

  getSettlementInfos() {
    GetSettlementInfos.apply(this);

    console.log("[Simulation Obj] #03 SettlementInfos Setting Successful :)");
    console.log(`length : ${this.settleMentList?.length}`);
  }
}

export default Simulation;
