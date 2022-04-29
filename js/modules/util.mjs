// Utility functions for shared functionality

// Initialise a formatter for displaying currency
const parseCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Extend the formatter to show plusminus, using the minus sign that
// has the same width as a plus sign
const parseCurrencyPlusMinus = (x) =>
  (x >= 0 ? "+" : "") + parseCurrency.format(x);

const getTableHTML = (tbodyInnerHTML) =>
  `<table class="table" style="table-layout:fixed;"><thead><tr><th>player</th><th class="text-end">net</th><th class="text-end">buy-in</th><th class="text-end">buy-out</th></tr></thead><tbody>${tbodyInnerHTML}</tbody></table>`;

// Get tbody HTML
const getTbodyHTML = (data, gameData) => {
  let innerHTML = "";

  // Iterate over all players
  for (const playerData of gameData) {
    const playerColour = data.players
      .filter((x) => x.name === playerData.player)[0]
      .colourRgb.map((x) => x + (255 - x) * 0.8);

    // Add tr
    innerHTML += `<tr style="background:rgb(${playerColour});border-color:rgb(${playerColour});">`;

    // Add name td
    innerHTML += `<td style="font-weight:bold">${playerData.player}</td>`;

    // Add numeric tds
    const vals = [
      parseCurrencyPlusMinus(playerData.delta),
      parseCurrency.format(playerData.buyin),
      parseCurrency.format(playerData.buyout),
    ];

    for (const val of vals) {
      innerHTML += `<td class="font-tabular-numbers text-end">${val}</td>`;
    }

    // Add closing tr
    innerHTML += "</tr>";
  }

  return innerHTML;
};

// Changes the selected game in the selected game section
const changeSelectedGame = (data, gameIds) => {
  // Get a few page elements
  const mainTitleElement = document.getElementById("selected-game-title");
  const dateElement = document.getElementById("selected-game-table-date-h4");
  const tablesDivElement = document.getElementById("selected-game-table-div");

  // Get games from IDs
  const games = gameIds.map((id) => data.games.find((game) => game.id === id));

  // Change the date
  const date = new Date(games[0].date.replace(/-/g, "/"));
  dateElement.textContent = date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Change the title
  mainTitleElement.textContent =
    games.length > 1 ? "Selected games" : "Selected game";

  // Add the tables
  let fullInnerHTML = "";

  for (const game of games) {
    fullInnerHTML += getTableHTML(getTbodyHTML(data, game.data));
  }

  // Set the inner HtML for the tables
  tablesDivElement.innerHTML = fullInnerHTML;
};

export { changeSelectedGame };
