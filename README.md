# Energy Trading

## Overview

배터리를 통해 거래가 이루어지는 것이 아니다. 사용량이 높은 가구의 누진 요금 구간을 회피 시키기 위한 알고리즘 이다. 여기서의 역할은 1) 수요자(사용량이 많아 누진구간의 회피를 위해 거래에서 사는 쪽에 속하는 가구), 2) 프로슈머(사용량이 적으며 자신의 누진구간 나머지를 파는 쪽에 속하는 가구) 로 나누어진다.

**하는 김에 lodash 제대로 사용해보귀,, ⭐️**

## Process

**1. csv file read**

```tsx
// src/index.ts
const csvPath = path.join(__dirname, "..", "static", "apt_780_201809.csv");
const simulation = new Simulation(csvPath);

// src/simulation/index.ts
class Simulation {
  orgMeterList: AptMeterDataMonth[];

  constructor(filePath: string) {
    const csvLines = readCsv(filePath);
    this.orgMeterList = csvLines.map(
      (csvLine) => new AptMeterDataMonth(csvLine.split(","))
    );
    // ...
  }
}
```

**[가구명, 월 사용량]**의 행으로 이루어진 csv 파일을 읽어들여 **AptMeterDataMonth 인스턴스화** 시킨다.

```tsx
class AptMeterDataMonth {
  isSimulate: boolean;
  dong: string;
  kwh: number;
}
```

**2. Simulation Process - Setting Prosumer**

```tsx
// usageBorder : 누진 1단계 구간까지 Cut Line
const _filtered = _.filter(
  this.orgMeterList,
  (meter) => meter.kwh < usageBorder
);
sumOfSupplyKWH = _.sumBy(_filtered, (meter) => usageBorder - meter.kwh);
```

거래에서 **파는 쪽의 입장이 될 수 있는 Prosumer를 Parsing** 한다. 이 때의 조건은 usageBorder, **누진 1단계 이하의 월 사용량을 보인 가구들을 필터링하고 이들의 합계**를 구한다. **sumOfSupplyKWH 변수는 이들의 누진 1단계 여유분량의 합산으로 만들어진 아파트의 거래가능 사용량**을 나타낸다.

**3. Target check by demand function**

**[ 수요함수 ]** 특정 집단의 수요를 표현하는 방법이다. 시장 균형을 찾거나, 수요공급의 변동을 볼 때, 정부가 개입했을 때, 환율에 변동이 생겼을 때 등 수식으로 정리해놓은 함수가 있다면 상호보완적으로 대처할 수 있다.

전력거래를 위한 수요함수는 1kWh당의 거래 가격이 낮을 수록 더 많은 거래를 진행한다는 의미의 모양을 가진다. 여기서 특정 거래 수량에 따른 가구별 선호 1kWh당 선호 가격은 아래의 공식에 의해 산정된다. ( 수요함수에 의해 도출되는 값들은 모든 수요자들이 특정 기간 내에 소비할 의사와 능력이 있고, 가격의 상승 하락에 따라 감소하고 증가하는 질이 동일한 재화나 서비스의 양을 만족한다는 조건하에 진행된다. )

![Untitled](Energy%20Trading%20d8bfc7c7351c4069b504f445acee57ba/Untitled.png)

```tsx
// src/simulation/index.ts
// class Simulation.run
while (sumOfSupplyKWH > 0) {
  const tmpTradeUnit =
    sumOfSupplyKWH - this.unitKWHforTrade < 0
      ? sumOfSupplyKWH
      : this.unitKWHforTrade;

  // parsing household, max profit to prosumer
  const buyerIdx = BuyerSelectionByListIdx.apply(this, [tmpTradeUnit]);
  const buyer = this.currentMeterList[buyerIdx];

  // ...
}
```

수요함수는 전력거래 로직 상에서 가장 최적의 전력거래 시뮬레이션을 실현하는데에 사용이 된다. tmpTradeUnit 변수는 거래의 최소 단위를 나타내고, buyerIdx는 BuyerSelectionByListIdx 함수에 의해 도출된 prosumer에게 가장 이익을 줄 수 있는 가구의 배열상 순번을 찾는 기능을 한다.

```tsx
// src/utils/ReactivePriceByTradeQty.ts
const PRICE_1 = 142.3;
const PRICE_2 = 73.3;

function ReactivePriceByTradeQty(
  qtyTrade: number,
  usageKWH: number,
  targetDate: Date
): number {
  // ...
  outputPrice =
    ((PRICE_1 - PRICE_2) / (demand1 - demand2)) * qtyTrade -
    (PRICE_1 * demand2 - PRICE_2 * demand1) / (demand1 - demand2);

  return outputPrice;
}
```

BuyerSelectionByListIdx 함수 내부에서 사용되는 ReactivePriceByTradeQty 함수가 바로 수요함수를 계산하는 함수이다. 수요함수에서 선호 가격에 대한 공식이 outputPrice의 대입연산에 사용되는 것을 확인할 수 있다.

```tsx
// src/simulation/BuyerSelectionByListIdx.ts

// ReactivePriceByTrade Qty : 수요함수에 의해 거래수량에 대한 1kWh당 선호 가격을 구한 후
// 판매자의 최대 선호 가격, 누진 1단계의 가격을 빼준다.
// 그리고 실제 거래수량을 곱해서 총 거래액수를 선정한다.
const bnfSeller: number[] = _.map(
  this.currentMeterList,
  (meter) =>
    (ReactivePriceByTradeQty(tmpTradeUnit, meter.kwh, this.targetDate) -
      SELLER_PRICE) *
    tmpTradeUnit
);
```

```tsx
// 이 후 가장 거래액수가 높은 가구의 순번을 반환한다.
return _.indexOf(bnfSeller, _.max(bnfSeller));
```

해당 로직은 당연하게도 거래수량 0쪽의 길이가 길어지는 원인인 사용량 증가로 인해 가장 사용량이 높은 가구가 prosumer에게 이득을 줄 수 있는 가구로 선정된다.

**4. Get Trading Result**

```tsx
// src/simulation/index.ts
while (sumOfSupplyKWH > 0) {
  // ...
  // Setting Result
  // Set buyerProfit
  const result: TradeResult = GetTradeResult(
    buyer,
    this.targetDate,
    buyerIdx,
    tmpTradeUnit
  );
  resultList.push(result);
  // ...
}
```

이제 해당 가구와 특정 가구가 거래를 하게될 경우, 해당 가구의 에너지를 구매한 가구에게 어느정도의 이득이 나타나는지를 나타내는 buyerProfit을 구할 것 이다.

```tsx
// src/utils/GetOperation.ts
// GetTradeResult Function
GetBuyerProfit(tradeDate, inputMeter.kwh, tradeUnit, tradePriceWON);
```

이 때 buyerProfit에 입력되는 값은 선정된 가구의 사용량 (inputMeter.kwh), 거래 단위 (tradeUnit), 수요함수로 도출된 거래 가격 (tradePriceWON)이 있다.

```tsx
export function GetBuyerProfit(
  targetDate: Date,
  buyerUsageKWH: number,
  qtyKWH: number, // 거래 단위
  price: number // 1kWh 당 거래 액수
): number {
  const usageAfterTrade: number = buyerUsageKWH - qtyKWH;
  let priceMargin = 0;

  if (usageAfterTrade > [누진2단계 최고값]) {
    priceMargin = 210.6 - price;
  } else if (usageAfterTrade <= [누진2단계 최고값]
			&& usageAfterTrade > [누진1단계 최고값]) {
    priceMargin = 142.3 - price;
  } else {
    priceMargin = 73.3 - price;
  }

  return priceMargin * qtyKWH;
}
```

구매자의 수익을 구하는 방법의 철학은 “내가(판매자) 1kWh당 현재 이만큼 내는데, 이 만큼에 팔게"로 시작한다. 그렇기 때문에 판매자의 판매 가격과 현재 판매자가 내고 있는 가격의 차를 priceMargin, 1kWh당 이득액으로 산정하고 qtyKWh, 거래단위를 곱하면 구매자의 이득액이 산정된다.

![Untitled](Energy%20Trading%20d8bfc7c7351c4069b504f445acee57ba/Untitled%201.png)

해당 방식을 이용하게 되면 사용량이 너무 많은 가구의 경우에는 오히려 판매자만 이득을 가지고 가는 형태가 되어버린다. 하지만 사용량이 많은 만큼 계속해서 시뮬레이션의 최대 가격을 가지고 있는 가구로 선정되어 거래가 많이 진행될 것 이기 때문에 후에는 양수의 값을 나타내는 모습을 확인할 수 있다.

**[ 여기까지의 과정 중에서 3~4의 과정을 sumOfSupplyKWH, 거래 가능 사용량이 모두 소진될 때까지 진행 ]**

```tsx
while (sumOfSupplyKWH > 0) {
  // ...
  this.currentMeterList[buyerIdx].kwh -= this.unitKWHforTrade;
  sumOfSupplyKWH -= this.unitKWHforTrade;
}
```

## Get Settlements

이제 Trading Simulation의 결과를 저장할 것 이다. 저장은 CSV파일로 진행이되는데 각 칼럼은 아래와 같은 정보를 가진다.

| Column     | Description                                                                                                                                                                                                                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORG GRID   | 기존 사용량에 대한 전력량요금                                                                                                                                                                                                                                                                                                       |
| MOD GRID   | 거래 후 변화한 사용량에 대한 전력량요금                                                                                                                                                                                                                                                                                             |
| Trade      | 참여한 거래 요금, 판매자는 음수의 값을 나타내고, 구매자는 양수의 값을 나타낸다.                                                                                                                                                                                                                                                     |
| INDV DIFF  | = MOD GRID + Trade - ORG GRID, 판매자는 기존 사용량보다 사용량이 증가하게 되고, 구매자는 사용량이 감소하게 된다. 이 때 판매자의 Trade 음수 값을 빼면 “변화한 사용량에 대한 요금 - 거래 요금”의 값으로 실제 값이 나타난다. 여기서 기존 사용량에 대한 전력량요금을 빼면 요금 차이가 산정된다. 구매자는 반대의 개념으로 접근하면 된다. |
| ORG PUB    | 기존 공용부 요금 (고정값)                                                                                                                                                                                                                                                                                                           |
| MOD PUB    | 에너지 거래 시뮬레이션을 진행하게 되면, 전체적으로 세대부 가격이 낮아지게 되면서 공용부 요금은 증가하게 된다. 그렇기 때문에 변화한 공용부 요금을 따로 기록한다. (고정값)                                                                                                                                                            |
| PUB DIFF   | 변화한 공용부 요금                                                                                                                                                                                                                                                                                                                  |
| TOTAL DIFF | INDV DIFF TOTAL 버전                                                                                                                                                                                                                                                                                                                |
| ORG Meter  | 기존 사용량                                                                                                                                                                                                                                                                                                                         |
| MK2 PUB    | 평균 사용량 이상인 가구에게는 조금 더 높은 공용부 요금 부과                                                                                                                                                                                                                                                                         |
| ORG Total  | 기존 사용량 + 기존 공용부 요금                                                                                                                                                                                                                                                                                                      |
| MOD Total  | 변화한 사용량 + 거래 가격 + 기존 공용부 요금                                                                                                                                                                                                                                                                                        |
| MK2 Total  | 변화한 사용량 + 거래 가격 + 평균 사용량 이상 가구에게는 패널티가 더 해진 공용부 요금 (MK2 PUB)                                                                                                                                                                                                                                      |

**1. Setting Variables**

**[ totalSales ]** 전체 거래 가격을 나타낸다. trade의 tradePriceWON 1kWh 거래가격을 포함하고 있으며, 여기에 현재 거래 단위인 tradeQtyKWH를 곱해주면 하나의 거래에서 성사된 총 가격액수를 알 수 있다.

```tsx
const totalSales: number = _.sumBy(
  this.resultList,
  (trade) => trade.tradePriceWON * trade.tradeQtyKWH
);
```

**[ totalTradeEnergy ]** 전체 거래 수량을 나타낸다. 모든 거래 가능 사용량이 거래가 진행됐다면 sumOfSupplyKWH와 같은 값을 나타낸다.

```tsx
// 전체 거래액 sumOfKWH 와 같을 거 같음
const totalTradeEnergy: number = _.sumBy(
  this.resultList,
  (trade) => trade.tradeQtyKWH
);
```

**[ totalHouseholdUsage ]** 세대부 총 사용량

```tsx
// 전체 가구 사용량
const totalHouseholdUsage: number = _.sumBy(
  this.orgMeterList,
  (meter) => meter.kwh
);
```

**[ AvgUsageForEach ]** 세대부 평균 사용량

```tsx
const AvgUsageForEach = totalHouseholdUsage / this.orgMeterList.length;
```

**[ publicUsage ]** 공용부 총 사용량 세대부 차지 percentage로 임의의 고정값

```tsx
const publicUsage: number = totalHouseholdUsage * 0.25;
```

**[ wholeAptCharge ]** 아파트 전체 요금

```tsx
const wholeAptCharge = GetWholeAptCharge(
  this.targetDate,
  totalHouseholdUsage,
  publicUsage,
  this.orgMeterList.length
);
```

**[ householdsCharge ]** 세대부 전체 요금

```tsx
// 세대부 전체 가격
const householdsCharge = GetWholeHouseholdCharge(
  this.targetDate,
  this.orgMeterList
);
```

( + ) 아파트 전체 요금과 같은 경우에는 하나의 가구처럼 아파트 평균 사용량에 대해 전기요금을 계산한 이후, 가구 수를 곱한다. 이 때 전기요금 계산은 CalculateResdnChargeByMonthHighVolt 함수가 진행한다.

```tsx
resultVal =
  CalculateResdnChargeByMonthHighVolt(avgWholeUsage, targetDate, false) *
  numHousehold;
```

( + ) 세대부 전체 요금은 가구 하나별로 계산을 해야 한다.

```tsx
return _.sumBy(inputList, (meter) =>
  CalculateResdnChargeByMonthHighVolt(meter.kwh, targetDate, false)
);
```

**[ publicCharge ]** 공용부 전체 요금

```tsx
const publicCharge: number = wholeAptCharge - householdsCharge;
```

**[ tradeWon, reducedEnergy ]** tradeWon은 총 거래 가격을 나타내는 배열 리스트이고, reducedEnergy는 거래에 사용된 사용량을 나타낸다. 두 배열 모두 아이템들이 음수가 판매자, 양수가 구매자를 나타낸다. 이는 거래 결과를 저장하고 있는 resultList를 순회할 때 첫 번째로 구매자 정보를 저장하고, 기존 사용량 정보 orgMeterList를 순회하면서 판매에 참여한 가구들을 판매자 정보로 저장한다.

```tsx
// 1. 구매자 정보 저장
this.resultList.forEach((trade) => {
  tradeWON[trade.householdIndex] += trade.tradePriceWON * trade.tradeQtyKWH;
  reducedEnergy[trade.householdIndex] += trade.tradeQtyKWH;
});

// 2. 판매자 정보 저장
this.orgMeterList.forEach((info, idx) => {
  if (info.kwh < usageBorder) {
    reducedEnergy[idx] = info.kwh - usageBorder;
    tradeWON[idx] = (info.kwh - usageBorder) * (totalSales / totalTradeEnergy);
  }
});
```

**[ modTotalHouseholdCharge ]** 판매자에게는 올라간 사용량, 구매자에게는 내려간 사용량에 대하여 전력량요금을 다시 계산한다.

```tsx
const modTotalHouseholdCharge = _.sum(
  _.map(this.orgMeterList, (meter, idx) =>
    CalculateResdnChargeByMonthHighVolt(
      meter.kwh - reducedEnergy[idx],
      this.targetDate,
      false
    )
  )
);
```

**[ modPublicCharge ]** 세대부의 가격은 거래에 의해 낮아졌을 것이다. 새로운 공용부 가격을 구해준다.

```tsx
const modPublicCharge: number = wholeAptCharge - modTotalHouseholdCharge;
```

**[ orgPublicWon ]** 기존 1가구 당 공용부 요금

```tsx
const orgPublicWON: number = publicCharge / this.orgMeterList.length;
```

**[ modPublicWon ]** 변경된 1가구 당 공용부 요금

```tsx
const modPublicWON: number = modPublicCharge / this.orgMeterList.length;
```

**[ excessAvgKWH, umOfExcessUsage, publicExcessPartCharge ]** 평균 이상 사용한 가구들의 사용량을 모아 위의 통계를 새롭게 만들어본다.

```tsx
const excessAvgKWH: number[] = _.map(this.orgMeterList, (meter) =>
  meter.kwh > AvgUsageForEach ? meter.kwh - AvgUsageForEach : 0
);
const sumOfExcessUsage: number = _.sum(excessAvgKWH);
const pubExcessPartCharge: number = modPublicCharge - publicCharge;
```

**2. Set Settlement**

```tsx
const settlementList: SettlementInfo[] = this.orgMeterList.map((info, idx) => {
  // ...
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
});
```

```tsx
settlementList.forEach((settlement, idx) => {
  if (this.orgMeterList[idx].kwh > AvgUsageForEach)
    settlement.anotherPubWon =
      pubExcessPartCharge * (excessAvgKWH[idx] / sumOfExcessUsage) +
      publicCharge / this.orgMeterList.length;
  else settlement.anotherPubWon = publicCharge / this.orgMeterList.length;

  settlement.totalOrgWon = settlement.orgHouseholdWON + settlement.orgPublicWON;
  settlement.totalModWon =
    settlement.modHouseholdWON + settlement.tradeWON + settlement.modPublicWON;
  settlement.totalAnotherWon =
    settlement.modHouseholdWON + settlement.tradeWON + settlement.anotherPubWon;
});
```
