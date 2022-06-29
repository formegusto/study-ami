import path from "path";
import Simulation from "./simulation";
import _ from "lodash";
import { saveCsv } from "./utils/saveCsv";

const csvPath = path.join(__dirname, "..", "static", "apt_780_201809.csv");
const simulation = new Simulation(csvPath);

simulation.run();
simulation.getSettlementInfos();

const savePath = path.join(
  __dirname,
  "..",
  "static",
  `result_${new Date().toISOString()}.csv`
);
saveCsv(simulation.settleMentList!, savePath);
