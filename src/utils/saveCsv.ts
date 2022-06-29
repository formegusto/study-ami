import _ from "lodash";
import { SettlementInfo } from "../types";
import fs from "fs";

export function saveCsv(settlements: SettlementInfo[], filePath: string) {
  const rows: string[] = [];

  rows.push(SettlementInfo.getRowHead());
  const settlementRows = _.map(settlements, (settlement) =>
    settlement.getRow()
  );
  const csvString = _.join(rows.concat(settlementRows), "\r\n");

  fs.writeFileSync(filePath, csvString);
}
