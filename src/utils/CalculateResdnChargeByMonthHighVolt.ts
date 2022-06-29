// 한달 사용량 요금 계산
export function CalculateResdnChargeByMonthHighVolt(
  valPowerKwh: number,
  targetDate: Date,
  baseChargeFlag: boolean
): number {
  let baseCharge: number = 0;
  let usageCharge: number = 0;

  if (
    valPowerKwh > 1000 &&
    (targetDate.getMonth() === 6 ||
      targetDate.getMonth() === 7 ||
      targetDate.getMonth() === 11 ||
      targetDate.getMonth() === 0 ||
      targetDate.getMonth() === 1)
  ) {
    // super user - 1000kWh over , winter & summer
    baseCharge = 6060;
    usageCharge = 200 * 73.3;
    usageCharge += 200 * 142.3;
    usageCharge += 600 * 210.6;
    usageCharge += (valPowerKwh - 1000) * 569.6;
  } else {
    if (targetDate.getMonth() === 6 || targetDate.getMonth() === 7) {
      // summmer
      if (valPowerKwh > 450) {
        // 450kWh over
        baseCharge = 6060;
        usageCharge = 300 * 73.3;
        usageCharge += 150 * 142.3;
        usageCharge += (valPowerKwh - 450) * 210.6;
      } else if (valPowerKwh <= 450 && valPowerKwh > 300) {
        // 300 ~ 450kWh
        baseCharge = 1260;
        usageCharge = 300 * 73.3;
        usageCharge += (valPowerKwh - 300) * 142.3;
      } // 300kWh under
      else {
        baseCharge = 730;
        usageCharge += valPowerKwh * 73.3;
      }
    } // spring, autumn, winter
    else {
      if (valPowerKwh > 400) {
        // 400kWh over
        baseCharge = 6060;
        usageCharge = 200 * 73.3;
        usageCharge += 200 * 142.3;
        usageCharge += (valPowerKwh - 400) * 210.6;
      } else if (valPowerKwh <= 400 && valPowerKwh > 200) {
        // 200 ~ 400kWh
        baseCharge = 1260;
        usageCharge = 200 * 73.3;
        usageCharge += (valPowerKwh - 200) * 142.3;
      } // 200kWh under
      else {
        baseCharge = 730;
        usageCharge = valPowerKwh * 73.3;
      }
    }
  }

  if (baseChargeFlag) {
    return usageCharge + baseCharge;
  } else {
    return usageCharge;
  }
}
