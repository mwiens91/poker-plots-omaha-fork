import { drawBoxPlot } from "./modules/boxplot.mjs";
import { drawCalendar } from "./modules/calendar.mjs";
import { data } from "./modules/dataModule.mjs";
import { drawLinePlot } from "./modules/lineplot.mjs";
import { initializePeopleSection } from "./modules/peopleSection.mjs";
import { drawPiePlot } from "./modules/pieplot.mjs";

// Initialize the people section
initializePeopleSection(data);

// Plot stuff
const linePlotMargin = { top: 10, bottom: 40, left: 35, right: 35 };
const boxPlotMargin = { top: 20, bottom: 40, left: 35, right: 35 };
const piePlotMargin = { top: 0, bottom: 0, left: 47, right: 47 };

const redrawLinePlot = drawLinePlot(data, "line-plot-parent", linePlotMargin);

const redrawBoxPlot = drawBoxPlot(data, "box-plot-parent", boxPlotMargin);

const redrawWinnerPiePlot = drawPiePlot(
  data.players.filter((x) => x.cumSum > 0),
  "winner-pie-chart-parent",
  piePlotMargin
);
const redrawLoserPiePlot = drawPiePlot(
  data.players.filter((x) => x.cumSum < 0),
  "loser-pie-chart-parent",
  piePlotMargin
);

drawCalendar(data, "calendar-parent");

// Viewport size dependent stuff; mostly redrawing plots
const MIN_ACCEPTABLE_WIDTH = 992;

const containerElement = document.getElementById("main-container");
const calendarElement = document.getElementById("calendar");
const alertBoxElement = document.getElementById("alert-box");
const pageUpCircleElement = document.getElementById("page-up-circle");

const pageUpCircleNormalTopMargin = parseInt(
  getComputedStyle(pageUpCircleElement).marginTop.slice(0, -2)
);

const narrowViewportHandle = (windowWidth) => {
  // Hide calendar element and show alertbox if viewport too narrow
  if (windowWidth < MIN_ACCEPTABLE_WIDTH) {
    calendarElement.style.display = "none";
    alertBoxElement.style.display = "block";

    pageUpCircleElement.style.marginTop =
      pageUpCircleNormalTopMargin +
      Math.round(alertBoxElement.offsetHeight) +
      "px";
  } else {
    calendarElement.style.display = "block";
    alertBoxElement.style.display = "none";

    pageUpCircleElement.style.marginTop = pageUpCircleNormalTopMargin + "px";
  }
};
narrowViewportHandle(document.documentElement.clientWidth);

let prevContainerWidth = containerElement.clientWidth;
let prevWindowWidth = document.documentElement.clientWidth;
let prevWindowHeightFloored =
  Math.floor(document.documentElement.clientHeight / 100) * 100;

const windowResizeListener = () => {
  const windowHeight = document.documentElement.clientHeight;
  const windowWidth = document.documentElement.clientWidth;

  const containerWidth = containerElement.clientWidth;
  const windowHeightFloored = Math.floor(windowHeight / 100) * 100;

  // Handle narrow viewport actions
  if (
    (windowWidth - MIN_ACCEPTABLE_WIDTH) *
      (prevWindowWidth - MIN_ACCEPTABLE_WIDTH) <=
    0
  ) {
    prevWindowWidth = windowWidth;

    narrowViewportHandle(windowWidth);
  }

  // If only the height has changed, we only need to redraw some of the
  // plots
  let redrawAllPlots = false;
  let redrawSomePlots = false;

  if (containerWidth !== prevContainerWidth) {
    prevContainerWidth = containerWidth;

    redrawAllPlots = true;
  }

  if (windowHeightFloored !== prevWindowHeightFloored) {
    prevWindowHeightFloored = windowHeightFloored;

    redrawSomePlots = true;
  }

  // Redraw the plots if necessary
  if (redrawAllPlots) {
    redrawLinePlot();
    redrawBoxPlot();
    redrawWinnerPiePlot();
    redrawLoserPiePlot();
  } else if (redrawSomePlots) {
    redrawLinePlot();
    redrawBoxPlot();
  }
};

window.addEventListener("resize", windowResizeListener);

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
