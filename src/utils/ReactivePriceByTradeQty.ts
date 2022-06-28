export function ReactivePriceByTradeQty(
  qtyTrade: number,
  usageKWH: number,
  targetDate: Date
): number {
  let outputPrice: number = 0;
  let price1: number = 0;
  let price2: number = 0;
  let demand1: number = 0;
  let demand2: number = 0;

  if (targetDate.getMonth() === 6 || targetDate.getMonth() === 7) {
    if (usageKWH > 450) {
      price1 = 142.3;
      price2 = 73.3;
      demand1 = usageKWH - 450;
      demand2 = usageKWH - 300;
    } else if (usageKWH <= 450 && usageKWH > 300) {
      price1 = 142.3;
      price2 = 73.3;
      demand1 = 0;
      demand2 = usageKWH - 300;
    } else {
      return 0;
    }
  } else {
    if (usageKWH > 400) {
      price1 = 142.3;
      price2 = 73.3;
      demand1 = usageKWH - 400;
      demand2 = usageKWH - 200;
    } else if (usageKWH <= 400 && usageKWH > 200) {
      price1 = 142.3;
      price2 = 73.3;
      demand1 = 0;
      demand2 = usageKWH - 200;
    } else {
      return 0;
    }
  }

  outputPrice =
    ((price1 - price2) / (demand1 - demand2)) * qtyTrade -
    (price1 * demand2 - price2 * demand1) / (demand1 - demand2);

  return outputPrice;
}
