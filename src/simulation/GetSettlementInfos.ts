import _ from "lodash";
import Simulation from ".";
import { SettlementInfo } from "../types";
import {
  CalculateResdnChargeByMonthHighVolt,
  GetWholeAptCharge,
  GetWholeHouseholdCharge,
} from "../utils";

export default function GetSettlementInfos(this: Simulation) {
  // orgInfoList
  // tradeList
  // scheduleTime
  if (!this.resultList) return;

  const tradeWON: number[] = _.fill(
    new Array(this.currentMeterList?.length),
    0
  );
  const reducedEnergy: number[] = _.fill(
    new Array(this.currentMeterList?.length),
    0
  );

  const totalSales: number = _.sumBy(
    this.resultList,
    (trade) => trade.tradePriceWON * trade.tradeQtyKWH
  );
  const totalTradeEnergy: number = _.sumBy(
    this.resultList,
    (trade) => trade.tradeQtyKWH
  );
  const totalHouseholdUsage: number = _.sumBy(
    this.orgMeterList,
    (meter) => meter.kwh
  );
  const AvgUsageForEach = totalHouseholdUsage / this.orgMeterList.length;
  const publicUsage: number = totalHouseholdUsage * 0.25;
  const wholeAptCharge = GetWholeAptCharge(
    this.targetDate,
    totalHouseholdUsage,
    publicUsage,
    this.orgMeterList.length
  );
  const publicCharge: number =
    wholeAptCharge -
    GetWholeHouseholdCharge(this.targetDate, this.orgMeterList);
  let usageBorder: number = 0;
  if (this.targetDate.getMonth() === 6 || this.targetDate.getMonth() === 7)
    usageBorder = 300;
  else usageBorder = 200;

  this.resultList.forEach((trade) => {
    tradeWON[trade.householdIndex] += trade.tradePriceWON * trade.tradeQtyKWH;
    reducedEnergy[trade.householdIndex] += trade.tradeQtyKWH;
  });
  this.orgMeterList.forEach((info, idx) => {
    if (info.kwh < usageBorder) {
      reducedEnergy[idx] = info.kwh - usageBorder;
      tradeWON[idx] =
        (info.kwh - usageBorder) * (totalSales / totalTradeEnergy);
    }
  });

  const modTotalHouseholdCharge = _.sum(
    _.map(this.orgMeterList, (meter, idx) =>
      CalculateResdnChargeByMonthHighVolt(
        meter.kwh - reducedEnergy[idx],
        this.targetDate,
        false
      )
    )
  );

  const modPublicCharge: number = wholeAptCharge - modTotalHouseholdCharge;

  const orgPublicWON: number = publicCharge / this.orgMeterList.length;
  const modPublicWON: number = modPublicCharge / this.orgMeterList.length;

  const excessAvgKWH: number[] = _.map(this.orgMeterList, (meter) =>
    meter.kwh > AvgUsageForEach ? meter.kwh - AvgUsageForEach : 0
  );
  const sumOfExcessUsage: number = _.sum(excessAvgKWH);
  const pubExcessPartCharge: number = modPublicCharge - publicCharge;

  const settlementList: SettlementInfo[] = this.orgMeterList.map(
    (info, idx) => {
      const orgHouseholdWON = CalculateResdnChargeByMonthHighVolt(
        info.kwh,
        this.targetDate,
        false
      );
      const modHouseholdWON = CalculateResdnChargeByMonthHighVolt(
        info.kwh - reducedEnergy[idx],
        this.targetDate,
        false
      );

      return new SettlementInfo(
        orgHouseholdWON,
        modHouseholdWON,
        tradeWON[idx],
        modHouseholdWON + tradeWON[idx] - orgHouseholdWON,
        orgPublicWON,
        modPublicWON,
        modPublicWON - orgPublicWON,
        modHouseholdWON +
          tradeWON[idx] +
          modPublicWON -
          (orgHouseholdWON + orgPublicWON),
        info.kwh,
        0,
        0,
        0,
        0
      );
    }
  );

  settlementList.forEach((settlement, idx) => {
    if (this.orgMeterList[idx].kwh > AvgUsageForEach)
      settlement.anotherPubWon =
        pubExcessPartCharge * (excessAvgKWH[idx] / sumOfExcessUsage) +
        publicCharge / this.orgMeterList.length;
    else settlement.anotherPubWon = publicCharge / this.orgMeterList.length;

    settlement.totalOrgWon =
      settlement.orgHouseholdWON + settlement.orgPublicWON;
    settlement.totalModWon =
      settlement.modHouseholdWON +
      settlement.tradeWON +
      settlement.modPublicWON;
    settlement.totalAnotherWon =
      settlement.modHouseholdWON +
      settlement.tradeWON +
      settlement.anotherPubWon;
  });

  this.settleMentList = settlementList;
}
