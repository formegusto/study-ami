import fs from "fs";

export function readCsv(filePath: string) {
  const file = fs.readFileSync(filePath, { encoding: "utf-8" });
  const csvString = file.toString();
  const csvLines = csvString.split("\r\n").slice(1);

  return csvLines;
}
