import { drawBoxPlot } from "./modules/boxplot.mjs";
import { drawCalendar } from "./modules/calendar.mjs";
import { drawLinePlot } from "./modules/lineplot.mjs";
import { drawPiePlot } from "./modules/pieplot.mjs";

// Draw the graph after fetching data
// fetch("../data/data.min.json") // uncomment this to use local version
fetch("https://mwiens91.github.io/poker-plots/data/data.min.json")
  .then((response) => response.json())
  .then((data) => {
    const bigPlotMargin = { top: 20, bottom: 20, left: 30, right: 30 };
    const piePlotMargin = { top: 0, bottom: 0, left: 27, right: 27 };
    const calendarMargin = { top: 0, bottom: 0, left: 0, right: 0 };
    const maxWidth = 950;

    const redrawLinePlot = drawLinePlot(
      data,
      "line-plot-parent",
      maxWidth,
      bigPlotMargin
    );

    const redrawBoxPlot = drawBoxPlot(
      data,
      "box-plot-parent",
      maxWidth,
      bigPlotMargin
    );

    const redrawWinnerPiePlot = drawPiePlot(
      data.players.filter((x) => x.cumSum > 0),
      "winner-pie-chart-parent",
      maxWidth,
      piePlotMargin
    );
    const redrawLoserPiePlot = drawPiePlot(
      data.players.filter((x) => x.cumSum < 0),
      "loser-pie-chart-parent",
      maxWidth,
      piePlotMargin
    );

    drawCalendar(data, "calendar-parent", calendarMargin);

    window.addEventListener("resize", redrawLinePlot);
    window.addEventListener("resize", redrawBoxPlot);
    window.addEventListener("resize", redrawWinnerPiePlot);
    window.addEventListener("resize", redrawLoserPiePlot);
  });

// Don't show calendar block if window is small
window.addEventListener("resize", () => {
  if (document.documentElement.clientWidth < 950) {
    document.getElementById("calendar").style.display = "none";
  } else {
    document.getElementById("calendar").style.display = "block";
  }
});

// Page up circle logic
const observer = new IntersectionObserver(
  (entries) => {
    const circleElem = document.getElementById("page-up-circle");

    if (entries[0].isIntersecting) {
      circleElem.style.display = "block";
    } else {
      circleElem.style.display = "none";
    }
  },
  { rootMargin: "0px 0px -80% 0px", threshold: [0] }
);

observer.observe(document.querySelector("#scroll-up-visible"));
