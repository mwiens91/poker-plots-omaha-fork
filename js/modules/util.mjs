// Utility functions for shared functionality

// Change the selected game in the selected game section. There are
// probably much cleaner ways of doing this, but just writing HTML like
// I'm doing here works.
const changeSelectedGame = (data, gameId) => {
  // Initialise a formatter for displaying currency
  const parseCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  // Extend the formatter to show plusminus, using the minus sign that
  // has the same width as a plus sign
  const parseCurrencyPlusMinus = (x) =>
    (x >= 0 ? "+" : "") + parseCurrency.format(x);

  // Get game
  const game = data.games.find((game) => game.id === gameId);

  // Change the date
  const dateElement = document.getElementById("selected-game-table-date-h4");
  const date = new Date(game.date.replace(/-/g, "/"));
  dateElement.textContent = date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Change the table body
  const tbodyElement = document.getElementById("selected-game-table-tbody");
  tbodyElement.innerHTML = "";

  let newInnerHTML = "";

  // Iterate over all players
  for (const playerData of game.data) {
    const playerColour = data.players
      .filter((x) => x.name === playerData.player)[0]
      .colourRgb.map((x) => x + (255 - x) * 0.8);

    // Add tr
    newInnerHTML += `<tr style="background:rgb(${playerColour});border-color:rgb(${playerColour});">`;

    // Add name td
    newInnerHTML += `<td style="font-weight:bold">${playerData.player}</td>`;

    // Add numeric tds
    const vals = [
      parseCurrencyPlusMinus(playerData.delta),
      parseCurrency.format(playerData.buyin),
      parseCurrency.format(playerData.buyout),
    ];

    for (const val of vals) {
      newInnerHTML += `<td class="font-tabular-numbers text-end">${val}</td>`;
    }

    // Add closing tr
    newInnerHTML += "</tr>";
  }

  tbodyElement.innerHTML = newInnerHTML;
};

export { changeSelectedGame };
