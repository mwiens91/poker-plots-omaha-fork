import { drawLinePlot } from "./modules/lineplot.mjs";

const MAX_WIDTH = 950;

// Draw the graph after fetching data
fetch("../data/data.min.json")
  .then((response) => response.json())
  .then((data) => drawLinePlot(data, "line-plot", MAX_WIDTH));
