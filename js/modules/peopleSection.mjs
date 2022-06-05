// Sets up the people section of the page and returns the starting
// player's name that was randomly selected
const initializePeopleSection = (data) => {
  // Minimum number of games to be randomly selected. If no players meet
  // this threshold, the minimum will lower to one.
  const minGames = 3;

  // Initialise a formatter for displaying currency
  const parseCurrency = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

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
  const peopleMatchupsDivElement = document.getElementById(
    "people-matchups-div"
  );

  // Function to adjust the above elements to a specific player
  const adjustPeopleBody = (player) => {
    // Adjust left hand side elements
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
          (x) => x.id === player.stats["largest-winning-streak"]["end-game-id"]
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
        parseCurrency.format(-player.stats["largest-losing-streak"].total);
      peopleMostMoneyLostConsecutiveSubElement.textContent =
        "on " +
        data.games.find(
          (x) => x.id === player.stats["largest-losing-streak"]["start-game-id"]
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
        -player.stats["most-lost-in-single-game"].total
      );
      peopleMostMoneyLostSingleSubElement.textContent =
        "on " +
        data.games.find(
          (x) => x.id === player.stats["most-lost-in-single-game"]["game-id"]
        ).date;
    }

    // Adjust right hand side elements, first clean up any existing
    // matchup divs
    peopleMatchupsDivElement.innerHTML = "";

    // Add matchups
    const maxMatchups = 6;

    for (const [idx, matchup] of player.matchupData.entries()) {
      if (idx > maxMatchups - 1) {
        break;
      }

      const div = document.createElement("div");

      div.classList.add("people-matchup-div");
      div.style.background =
        "rgb(" + player.colourRgb.map((x) => x + (255 - x) * 0.7) + ")";

      div.innerHTML =
        '<div style="padding-bottom: 6px">' +
        `<b>${matchup.players.join(", ")}</b><br>` +
        "<em>" +
        `${matchup.gameCount} game${matchup.gameCount > 1 ? "s" : ""}` +
        ", " +
        `${matchup.players.length} players` +
        "</em>" +
        "</div>" +
        `<span style="font-size: 16px"<>${parseCurrency.format(
          matchup.cumSum
        )}</span>`;

      peopleMatchupsDivElement.appendChild(div);
    }
  };

  // Add mouseover listeners to people legend avatars
  for (const player of data.players) {
    const legendElement = document.getElementById(
      "people-icon-div-" + player.name
    );

    legendElement.addEventListener("mouseover", () => adjustPeopleBody(player));
  }

  // Randomly select one of the players to activate in the people
  // section
  let filteredPlayers = data.players.filter(
    (player) => player.gameCount >= minGames
  );

  if (filteredPlayers.length === 0) {
    filteredPlayers = data.players;
  }

  const randomPlayer =
    filteredPlayers[Math.floor(Math.random() * filteredPlayers.length)];
  adjustPeopleBody(randomPlayer);

  return randomPlayer.name;
};

export { initializePeopleSection };
