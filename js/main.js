import { drawBoxPlot } from "./modules/boxplot.mjs";
import { drawCalendar } from "./modules/calendar.mjs";
import { drawLinePlot } from "./modules/lineplot.mjs";
import { initializePeopleSection } from "./modules/peopleSection.mjs";
import { drawPiePlot } from "./modules/pieplot.mjs";

// Draw the graph after fetching data
// fetch("../data/data.min.json") // uncomment this to use local version
fetch("https://mwiens91.github.io/poker-plots/data/data.min.json")
  .then((response) => response.json())
  .then((data) => {
    // Initialize the people section
    initializePeopleSection(data);

    // Plot stuff
    const linePlotMargin = { top: 10, bottom: 20, left: 30, right: 30 };
    const boxPlotMargin = { top: 20, bottom: 20, left: 30, right: 30 };
    const piePlotMargin = { top: 0, bottom: 0, left: 27, right: 27 };
    const calendarMargin = { top: 0, bottom: 0, left: 0, right: 0 };
    const maxWidth = 950;

    const redrawLinePlot = drawLinePlot(
      data,
      "line-plot-parent",
      maxWidth,
      linePlotMargin
    );

    const redrawBoxPlot = drawBoxPlot(
      data,
      "box-plot-parent",
      maxWidth,
      boxPlotMargin
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

    // For redrawing plots, we can either add event listeners to the
    // window and check against the Bootstrap container breakpoints,
    // or we can simply observe the container for changes to its size.
    // We'll take the latter approach here
    const mainContainerElement = document.getElementById("main-container");
    let prevWidth = null;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.borderBoxSize[0].inlineSize;

        if (prevWidth === null) {
          prevWidth = width;
        } else if (width !== prevWidth) {
          prevWidth = width;

          redrawLinePlot();
          redrawBoxPlot();
          redrawWinnerPiePlot();
          redrawLoserPiePlot();
        }
      }
    });
    resizeObserver.observe(mainContainerElement);

    // We also want to redraw the lineplot and boxplot at different height
    // breakpoints; these breakpoints exist here, but we invoke them
    // explicitly
    let prevWindowHeightFloored =
      Math.floor(document.documentElement.clientHeight / 100) * 100;
    window.addEventListener("resize", () => {
      const windowHeightFloored =
        Math.floor(document.documentElement.clientHeight / 100) * 100;

      if (windowHeightFloored !== prevWindowHeightFloored) {
        prevWindowHeightFloored = windowHeightFloored;

        redrawLinePlot();
        redrawBoxPlot();
      }
    });
  });

// Don't show calendar block if window is small; also show a warning
const calendarElement = document.getElementById("calendar");
const alertBoxElement = document.getElementById("alert-box");

const hideCalendarIfViewportNarrow = () => {
  if (document.documentElement.clientWidth < 992) {
    calendarElement.style.display = "none";
    alertBoxElement.style.display = "block";
  } else {
    calendarElement.style.display = "block";
    alertBoxElement.style.display = "none";
  }
};
hideCalendarIfViewportNarrow();
window.addEventListener("resize", hideCalendarIfViewportNarrow);

// Page up circle logic
const circleElem = document.getElementById("page-up-circle");

const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      circleElem.style.display = "block";
    } else {
      circleElem.style.display = "none";
    }
  },
  { rootMargin: "0px 0px -80% 0px", threshold: [0] }
);

observer.observe(document.querySelector("#scroll-up-visible"));
