export class AptMeterDataMonth {
  isSimulate: boolean;
  dong: string;
  kwh: number;
  constructor(line: string[]) {
    this.isSimulate = false;
    this.dong = line[0];
    this.kwh = Number.parseFloat(line[1]);
  }
}
