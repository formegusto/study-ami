const PRICE_1 = 142.3;
const PRICE_2 = 73.3;

export function ReactivePriceByTradeQty(
  qtyTrade: number,
  usageKWH: number,
  targetDate: Date
): number {
  // 수요함수 구하는 로직
  //
  let outputPrice: number = 0;
  let demand1: number = 0;
  let demand2: number = 0;

  if (targetDate.getMonth() === 6 || targetDate.getMonth() === 7) {
    // 여름 시즌
    // 누진 구간 3단계 가구
    if (usageKWH > 450) {
      demand1 = usageKWH - 450;
      demand2 = usageKWH - 300;
    } else if (usageKWH <= 450 && usageKWH > 300) {
      demand1 = 0;
      demand2 = usageKWH - 300;
    } else {
      return 0;
    }
  } else {
    // 기타 계절
    // 누진 구간 3단계 가구
    if (usageKWH > 400) {
      demand1 = usageKWH - 400;
      demand2 = usageKWH - 200;
    } else if (usageKWH <= 400 && usageKWH > 200) {
      demand1 = 0;
      demand2 = usageKWH - 200;
    } else {
      return 0;
    }
  }

  outputPrice =
    ((PRICE_1 - PRICE_2) / (demand1 - demand2)) * qtyTrade -
    (PRICE_1 * demand2 - PRICE_2 * demand1) / (demand1 - demand2);

  return outputPrice;
}
