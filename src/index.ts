import path from "path";
import Simulation from "./simulation";

const csvPath = path.join(__dirname, "..", "static", "apt_780_201809.csv");
const simulation = new Simulation(csvPath);
