import { drawLinePlot } from "./modules/lineplot.mjs";

// Draw the graph after fetching data
fetch("../data/data.min.json")
  .then((response) => response.json())
  .then((data) => {
    drawLinePlot(data, "line-plot", 950, 60, 40);
  });
