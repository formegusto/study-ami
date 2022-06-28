import Simulation from ".";
import { AptMeterDataMonth } from "../types";

export default function BuyerSelectionByListIdx(this: Simulation) {
  const bnfSeller: number[] = Array.from(
    {
      length: this.orgMeterList.length,
    },
    () => 0
  );
}
