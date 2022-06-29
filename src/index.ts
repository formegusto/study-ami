import path from "path";
import Simulation from "./simulation";
import _ from "lodash";

const csvPath = path.join(__dirname, "..", "static", "apt_780_201809.csv");
const simulation = new Simulation(csvPath);

simulation.run();

console.log(_.take(simulation.resultList, 10));
