import { AptMeterDataMonth } from "../types";
import { readCsv } from "../utils";

class Simulation {
  inputDataMeter: AptMeterDataMonth[];
  constructor(filePath: string) {
    const csvLines = readCsv(filePath);
    this.inputDataMeter = csvLines.map(
      (csvLine) => new AptMeterDataMonth(csvLine.split(","))
    );
    console.log("data parsing okay");
    console.log(this.inputDataMeter);
  }
}

export default Simulation;
