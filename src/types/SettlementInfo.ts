import _ from "lodash";

export const OBJECT_TO_COLUMNS_MATCHING = [
  {
    key: "orgHouseholdWON",
    name: "ORG GRID(Won)",
  },
  {
    key: "modHouseholdWON",
    name: "MOD GRID(Won)",
  },
  {
    key: "tradeWON",
    name: "Trade(Won)",
  },
  {
    key: "diffHouseholdWON",
    name: "INDV DIFF(Won)",
  },
  {
    key: "orgPublicWON",
    name: "ORG PUB(Won)",
  },
  {
    key: "modPublicWON",
    name: "MOD PUB(Won)",
  },
  {
    key: "diffPublicWON",
    name: "PUB DIFF(Won)",
  },
  {
    key: "totalDiffWON",
    name: "TOTAL DIFF(Won)",
  },
  {
    key: "orgMeterKWH",
    name: "ORG Meter(kWh)",
  },
  {
    key: "anotherPubWon",
    name: "MK2 PUB(Won)",
  },
  {
    key: "totalOrgWon",
    name: "ORG Total(Won)",
  },
  {
    key: "totalModWon",
    name: "MOD Total(Won)",
  },
  {
    key: "totalAnotherWon",
    name: "MK2 Total(Won)",
  },
];

const KEYS = _.map(OBJECT_TO_COLUMNS_MATCHING, ({ key }) => key);

export class SettlementInfo {
  [key: string]: any;

  constructor(...args: number[]) {
    args.forEach((arg, idx) => {
      this[KEYS[idx]] = arg;
    });
  }

  static getRowHead = () =>
    _.join(
      _.map(
        OBJECT_TO_COLUMNS_MATCHING,
        (obj_to_col_mat) => obj_to_col_mat.name
      ),
      ","
    );
}
