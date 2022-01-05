import { drawBoxPlot } from "./modules/boxplot.mjs";
import { drawLinePlot } from "./modules/lineplot.mjs";

// Draw the graph after fetching data
// fetch("../data/data.min.json") // uncomment this to use local version
fetch("https://mwiens91.github.io/poker-plots/data/data.min.json")
  .then((response) => response.json())
  .then((data) => {
    const margin = { top: 20, bottom: 20, left: 30, right: 30 };
    const maxWidth = 950;

    const redrawLinePlot = drawLinePlot(data, "line-plot", maxWidth, margin);
    const redrawBoxPlot = drawBoxPlot(data, "box-plot", maxWidth, margin);

    window.addEventListener("resize", redrawLinePlot);
    window.addEventListener("resize", redrawBoxPlot);
  });
