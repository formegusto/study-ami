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

  // tradePriceWon : 1kWh당 거래 가력, 현재 5단위로 하고 있으니까 모두 곱하고 더해서
  // 전체적인 거래 가격을 담고 있음 totalSales
  const totalSales: number = _.sumBy(
    this.resultList,
    (trade) => trade.tradePriceWON * trade.tradeQtyKWH
  );
  // 전체 거래액 sumOfKWH 와 같을 거 같음
  const totalTradeEnergy: number = _.sumBy(
    this.resultList,
    (trade) => trade.tradeQtyKWH
  );
  // 전체 가구 사용량
  const totalHouseholdUsage: number = _.sumBy(
    this.orgMeterList,
    (meter) => meter.kwh
  );
  // 평균사용량
  const AvgUsageForEach = totalHouseholdUsage / this.orgMeterList.length;
  // 고정값인듯,  사용량은 세대부의 25%
  const publicUsage: number = totalHouseholdUsage * 0.25;
  // 아파트 전체 가격
  const wholeAptCharge = GetWholeAptCharge(
    this.targetDate,
    totalHouseholdUsage,
    publicUsage,
    this.orgMeterList.length
  );
  // 세대부 전체 가격
  const householdsCharge = GetWholeHouseholdCharge(
    this.targetDate,
    this.orgMeterList
  );
  const publicCharge: number = wholeAptCharge - householdsCharge;

  // 한계치
  let usageBorder: number = 0;
  if (this.targetDate.getMonth() === 6 || this.targetDate.getMonth() === 7)
    usageBorder = 300;
  else usageBorder = 200;

  // 1. 구매자 정보 저장
  this.resultList.forEach((trade) => {
    // 총 거래요금
    tradeWON[trade.householdIndex] += trade.tradePriceWON * trade.tradeQtyKWH;
    // 절감 에너지
    reducedEnergy[trade.householdIndex] += trade.tradeQtyKWH;
  });
  // 2. 판매자 정보 저장
  this.orgMeterList.forEach((info, idx) => {
    // 판 쪽, 거래에서 프로슈머의 역할자
    if (info.kwh < usageBorder) {
      // 평균적으로 나누어 가짐
      reducedEnergy[idx] = info.kwh - usageBorder;
      tradeWON[idx] =
        (info.kwh - usageBorder) * (totalSales / totalTradeEnergy);
    }
  });

  // tradeWON : 마이너스가 판매자, 플러스가 구매자
  // reducedEnergy : 마이너스가 판매자, 플러스가 구매자

  // 판매자들은 올라간 사용량, 구매자들은 내려간 사용량으로 전력량요금 재계산
  const modTotalHouseholdCharge = _.sum(
    _.map(this.orgMeterList, (meter, idx) =>
      CalculateResdnChargeByMonthHighVolt(
        meter.kwh - reducedEnergy[idx],
        this.targetDate,
        false
      )
    )
  );
  // 공용부 요금 재 계산, 올라갈거임
  const modPublicCharge: number = wholeAptCharge - modTotalHouseholdCharge;
  // 1가구 당 공용부 요금 계산
  const orgPublicWON: number = publicCharge / this.orgMeterList.length;
  const modPublicWON: number = modPublicCharge / this.orgMeterList.length;

  // 평균 이상 사용한 가구들의 사용량 모으기
  const excessAvgKWH: number[] = _.map(this.orgMeterList, (meter) =>
    meter.kwh > AvgUsageForEach ? meter.kwh - AvgUsageForEach : 0
  );
  // 총합 구하기
  const sumOfExcessUsage: number = _.sum(excessAvgKWH);
  // 공용부 요금은 올라가게 되어있음. 그래서 차이 구함
  const pubExcessPartCharge: number = modPublicCharge - publicCharge;

  //
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
        orgHouseholdWON, // ORG GRID : 원래 GRID 에 따른 요금
        modHouseholdWON, // MOD GRID : 판매자는 높게, 구매자는 적게의 GRID 요금
        tradeWON[idx], // Trade : Trading 가격
        modHouseholdWON + tradeWON[idx] - orgHouseholdWON, // INDV DIFF : 변화 사용량 + 거래 가격 - 원래가격
        // 판매자의 가격 : 팔아서 자신의 사용량이 높아져서 사용량 요금이 올라감, 거기서 거래 가격을 이득으로 챙김, 그리고 원래가격을 빼면
        // 원래 가격에서 달라진 금액을 구할 수 있음
        orgPublicWON, // 원래 공용부 가격 (고정값)
        modPublicWON, // 변화한 공용부 가격 (고정값))
        modPublicWON - orgPublicWON, // 둘 차이 (고정값)
        modHouseholdWON +
          tradeWON[idx] +
          modPublicWON -
          (orgHouseholdWON + orgPublicWON), // 차이에서 공용부 차이만 더한 것
        info.kwh, // 원래 사용량
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
