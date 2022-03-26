import { drawBoxPlot } from "./modules/boxplot.mjs";
import { drawCalendar } from "./modules/calendar.mjs";
import { drawLinePlot } from "./modules/lineplot.mjs";
import { drawPiePlot } from "./modules/pieplot.mjs";

// Initialise a formatter for displaying currency
const parseCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Draw the graph after fetching data
// fetch("../data/data.min.json") // uncomment this to use local version
fetch("https://mwiens91.github.io/poker-plots/data/data.min.json")
  .then((response) => response.json())
  .then((data) => {
    // Get the elements for the people section
    const peopleAvatarElement = document.getElementById("people-body-avatar");
    const peoplePlayerTitleNameElement = document.getElementById(
      "people-body-player-title-name"
    );
    const peoplePlayerTitleDividerElement = document.getElementById(
      "people-body-player-title-divider"
    );
    const peoplePlayerTitleCumsumElement = document.getElementById(
      "people-body-player-title-cumsum"
    );
    const peopleHrElement = document.getElementById("people-body-hr");
    const peopleGamesPlayedElement = document.getElementById(
      "people-body-games-played"
    );
    const peopleTotalMoneyWonElement = document.getElementById(
      "people-body-total-money-won"
    );
    const peopleTotalMoneyLostElement = document.getElementById(
      "people-body-total-money-lost"
    );
    const peopleMostMoneyWonConsecutiveMainElement = document.getElementById(
      "people-body-most-money-won-consecutive-main"
    );
    const peopleMostMoneyWonConsecutiveSubElement = document.getElementById(
      "people-body-most-money-won-consecutive-sub"
    );
    const peopleMostMoneyLostConsecutiveMainElement = document.getElementById(
      "people-body-most-money-lost-consecutive-main"
    );
    const peopleMostMoneyLostConsecutiveSubElement = document.getElementById(
      "people-body-most-money-lost-consecutive-sub"
    );
    const peopleMostMoneyWonSingleMainElement = document.getElementById(
      "people-body-most-money-won-single-main"
    );
    const peopleMostMoneyWonSingleSubElement = document.getElementById(
      "people-body-most-money-won-single-sub"
    );
    const peopleMostMoneyLostSingleMainElement = document.getElementById(
      "people-body-most-money-lost-single-main"
    );
    const peopleMostMoneyLostSingleSubElement = document.getElementById(
      "people-body-most-money-lost-single-sub"
    );

    // Function to adjust the above elements to a specific player
    const adjustPeopleBody = (player) => {
      peopleAvatarElement.setAttribute("src", player.avatar);
      peoplePlayerTitleNameElement.textContent = player.name;
      peoplePlayerTitleDividerElement.style.color = player.colourHex;
      peoplePlayerTitleCumsumElement.textContent = parseCurrency.format(
        player.cumSum
      );
      peopleHrElement.style.backgroundColor = player.colourHex;
      peopleGamesPlayedElement.textContent = player.gameCount;
      peopleTotalMoneyWonElement.textContent = parseCurrency.format(
        player.stats["total-money-won"]
      );
      peopleTotalMoneyLostElement.textContent = parseCurrency.format(
        player.stats["total-money-lost"]
      );

      if (player.stats["largest-winning-streak"] === null) {
        peopleMostMoneyWonConsecutiveMainElement.textContent = "?";
        peopleMostMoneyWonConsecutiveSubElement.textContent =
          player.name + " has never won a game";
      } else if (player.stats["largest-winning-streak"]["num-games"] === 1) {
        peopleMostMoneyWonConsecutiveMainElement.textContent = "?";
        peopleMostMoneyWonConsecutiveSubElement.textContent =
          player.name + " has never won consecutive games";
      } else {
        peopleMostMoneyWonConsecutiveMainElement.textContent =
          parseCurrency.format(player.stats["largest-winning-streak"].total);
        peopleMostMoneyWonConsecutiveSubElement.textContent =
          "on " +
          data.games.find(
            (x) =>
              x.id === player.stats["largest-winning-streak"]["start-game-id"]
          ).date +
          " through " +
          data.games.find(
            (x) =>
              x.id === player.stats["largest-winning-streak"]["end-game-id"]
          ).date +
          " (" +
          player.stats["largest-winning-streak"]["num-games"] +
          " games)";
      }

      if (player.stats["largest-losing-streak"] === null) {
        peopleMostMoneyLostConsecutiveMainElement.textContent = "?";
        peopleMostMoneyLostConsecutiveSubElement.textContent =
          player.name + " has never lost a game";
      } else if (player.stats["largest-losing-streak"]["num-games"] === 1) {
        peopleMostMoneyLostConsecutiveMainElement.textContent = "?";
        peopleMostMoneyLostConsecutiveSubElement.textContent =
          player.name + " has never lost consecutive games";
      } else {
        peopleMostMoneyLostConsecutiveMainElement.textContent =
          parseCurrency.format(player.stats["largest-losing-streak"].total);
        peopleMostMoneyLostConsecutiveSubElement.textContent =
          "on " +
          data.games.find(
            (x) =>
              x.id === player.stats["largest-losing-streak"]["start-game-id"]
          ).date +
          " through " +
          data.games.find(
            (x) => x.id === player.stats["largest-losing-streak"]["end-game-id"]
          ).date +
          " (" +
          player.stats["largest-losing-streak"]["num-games"] +
          " games)";
      }

      if (player.stats["most-won-in-single-game"] === null) {
        peopleMostMoneyWonSingleMainElement.textContent = "?";
        peopleMostMoneyWonSingleSubElement.textContent =
          player.name + " has never won a game";
      } else {
        peopleMostMoneyWonSingleMainElement.textContent = parseCurrency.format(
          player.stats["most-won-in-single-game"].total
        );
        peopleMostMoneyWonSingleSubElement.textContent =
          "on " +
          data.games.find(
            (x) => x.id === player.stats["most-won-in-single-game"]["game-id"]
          ).date;
      }

      if (player.stats["most-lost-in-single-game"] === null) {
        peopleMostMoneyLostSingleMainElement.textContent = "?";
        peopleMostMoneyLostSingleSubElement.textContent =
          player.name + " has never lost a game";
      } else {
        peopleMostMoneyLostSingleMainElement.textContent = parseCurrency.format(
          player.stats["most-lost-in-single-game"].total
        );
        peopleMostMoneyLostSingleSubElement.textContent =
          "on " +
          data.games.find(
            (x) => x.id === player.stats["most-lost-in-single-game"]["game-id"]
          ).date;
      }
    };

    // Add mouseover listeners to people legend avatars
    for (const player of data.players) {
      const legendElement = document.getElementById(
        "people-icon-div-" + player.name
      );

      legendElement.addEventListener("mouseover", () =>
        adjustPeopleBody(player)
      );
    }

    // Randomly select one of the players to activate in the people
    // section
    const randomPlayer =
      data.players[Math.floor(Math.random() * data.players.length)];
    adjustPeopleBody(randomPlayer);

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

    window.addEventListener("resize", redrawLinePlot);
    window.addEventListener("resize", redrawBoxPlot);
    window.addEventListener("resize", redrawWinnerPiePlot);
    window.addEventListener("resize", redrawLoserPiePlot);
  });

// Don't show calendar block if window is small
const hideCalendarIfViewportNarrow = () => {
  if (document.documentElement.clientWidth < 992) {
    document.getElementById("calendar").style.display = "none";
  } else {
    document.getElementById("calendar").style.display = "block";
  }
};
hideCalendarIfViewportNarrow();
window.addEventListener("resize", hideCalendarIfViewportNarrow);

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
