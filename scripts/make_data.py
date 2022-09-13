#!/usr/bin/env python3

# pylint: disable=invalid-name, redefined-outer-name, too-many-branches, too-many-locals, unsubscriptable-object

"""
This script generates JSON data using the raw data of Poker Now ledgers
(just copy-pasted). The output JSON has the following structure:

    {
      players:
        [
          {
            name: str,
            colourHex: str,
            colourRgb: [ int ],
            avatar: str,
            gameCount: int,
            cumSum: float,
            data:
              [
                {
                  id: int,
                  date: str,
                  player: str,
                  buyin: float,
                  buyout: float,
                  delta: float,
                  cumSum: float,
                }
              ],
            matchupData:
              [
                {
                  player: str,
                  players: [ str ],
                  gameCount: int,
                  cumSum: float
                }
              ],
            stats:
              {
                "total-money-won": float,
                "total-money-lost": float,
                "largest-winning-streak":
                  {
                    "num-games": int,
                    "total": float,
                    "start-game-id": int,
                    "end-game-id": int,
                  },
                "largest-losing-streak":
                  {
                    "num-games": int,
                    "total": float,
                    "start-game-id": int,
                    "end-game-id": int,
                  },
                "most-won-in-single-game":
                  {
                    "total": float,
                    "game-id": int,
                  },
                "most-lost-in-single-game":
                  {
                    "total": float,
                    "game-id": int,
                  }
              }
          }
        ],
      games:
        [
          {
            id: int
            date: str,
            data:
              [
                {
                  player: str,
                  buyin: float,
                  buyout: float,
                  delta: float,
                }
              ]
          }
        ]
    }

Games are sorted by date (in "first to last" order). Players are sorted
by cumulative sum.
"""

import json
from operator import itemgetter
import os
import sys
from typing import Union

DATA_DIR = "../data"
RAW_DATA_DIR = DATA_DIR + "/raw"
MODULES_DIR = "../js/modules"
OUTFILE = DATA_DIR + "/data.json"
OUTFILE_MIN = DATA_DIR + "/data.min.json"
OUTFILE_MODULE = MODULES_DIR + "/dataModule.mjs"

AVATAR_BASE_URL = "https://mwiens91.github.io/poker-plots/data/avatars"
# AVATAR_BASE_URL = DATA_DIR + "/avatars"  # uncomment this to use local avatars

# Colours for players. These are generated automatically and inserted
# into this script by the make_player_colours.mjs script.
PLAYER_COLOURS_HEX = {
    "david": "#70ad4b",
    "bobby": "#8772c8",
    "bei": "#c75a8f",
    "shawn": "#d2a649",
    "matt": "#50b09a",
    "aidan": "#cd5943",
    "juno": "#887234",
}
PLAYER_COLOURS_RGB = {
    "david": [112, 173, 75],
    "bobby": [135, 114, 200],
    "bei": [199, 90, 143],
    "shawn": [210, 166, 73],
    "matt": [80, 176, 154],
    "aidan": [205, 89, 67],
    "juno": [136, 114, 52],
}


def process_raw_data() -> tuple[
    list[dict[str, Union[str, int, list[dict[str, Union[str, float]]]]]],
    dict[str, list[dict[str, Union[str, int, float]]]],
]:
    """Processes raw game data files.

    Returns:
      A three-tuple containing (1) a list of games and (2) a dictionary
      with players as keys and their games as values.

      The list of games has the following structure:

      [
        {
          id: int,
          date: str,
          data:
            [
              {
                player: str,
                buyin: float,
                buyout: float,
                delta: float
              }
            ]
        }
      ]

      The dictionary of players has this structure:

      {
        name:
          [
            {
              id: int,
              date: str,
              player: str,
              buyin: float,
              buyout: float,
              delta: float,
            }
          ]
      }

      Note that all player names are in titlecase in all of the objects
      returned.

    Raises:
      RuntimeError: Either when (1) player name not found in the player
        colour dictionaries was encountered in the raw data, or (2) when
        a game's sum of buyins and buyouts was non-zero.
    """
    # Initialize objects to return
    game_data_list = []
    player_data_dict = {}

    # Get all raw data file paths
    raw_data_files = sorted([f for f in os.listdir(RAW_DATA_DIR) if f[-3:] == "txt"])

    # Start game ID counter
    current_id = 1

    # Make a set of recognized players
    valid_player_names = {name.title() for name in PLAYER_COLOURS_HEX}

    # Parse the raw data files
    for filename in raw_data_files:
        # Initialize dict for this game - the date is encoded in the file
        # name
        date = filename[:-7]
        game_id = current_id

        game = {"id": game_id, "date": date, "data": []}

        # This is to check that everything adds to zero
        game_delta_sum = 0

        # Increment the current game ID
        current_id += 1

        # Get lines from the raw data file
        path = os.path.join(RAW_DATA_DIR, filename)

        with open(path, encoding="utf-8") as f:
            lines = [l.rstrip() for l in f.readlines()]

        # Now we'll parse the lines. There are two formats we need to
        # potentially worry about here. On Firefox, the ledger will be
        # copy-pasted as
        #
        # PLAYERNAME POSSIBLY WITH WHITESPACE @ SOMEID
        # BUYIN BUYOUT STACK NET
        #
        # where this pattern is repeated for each player. On Chrome, it
        # copy-pastes each player's data in one line:
        #
        # PLAYERNAME POSSIBLY WITH WHITESPACE @ SOMEID BUYIN BUYOUT STACK NET
        #
        # Technically for the above string "DETAILS" (which is grabbed from
        # a button element named with that string) is appended to the ID,
        # but we aren't using the IDs so this doesn't really matter.
        is_firefox_format = len(lines[0].rpartition("@")[-1].split()) == 1

        # Now, depending on the format, we'll group the data differently
        # when we iterate through it. For Firefox format, we'll group
        # the lines pairwise; for Chrome format, line-by-line is
        # obviously fine.
        iter_lines = zip(*[iter(lines)] * 2) if is_firefox_format else lines

        for iter_line in iter_lines:
            # Parse the line(s)
            if is_firefox_format:
                l1, l2 = iter_line
                player_name_raw = " ".join(l1.split()[:-2])
                player_data = [float(x) for x in l2.split()]
            else:
                l_split = iter_line.split()
                player_name_raw = " ".join(l_split[:-6])
                player_data = [float(x) for x in l_split[-4:]]

            buyin = player_data[0]
            buyout = player_data[1] + player_data[2]
            delta = player_data[3]
            player_name = player_name_raw.lower().title()

            # Make sure player is valid; if not, raise an exception
            if not player_name in valid_player_names:
                raise RuntimeError(
                    f'Invalid player name "{player_name_raw}" encounted in {filename}.'
                )

            # Add data for this game dict
            game["data"].append(
                dict(player=player_name, buyin=buyin, buyout=buyout, delta=delta)
            )

            # Add data for the players dict
            if player_name not in player_data_dict:
                player_data_dict[player_name] = []

            player_data_dict[player_name].append(
                dict(
                    id=game_id,
                    date=date,
                    player=player_name,
                    buyin=buyin,
                    buyout=buyout,
                    delta=delta,
                )
            )

            # Add the delta to the game's delta sum
            game_delta_sum = round(game_delta_sum + delta, 2)

        # Make sure the game delta's sum is 0
        if game_delta_sum:
            # Game's buyins/buyouts do not add to 0
            raise RuntimeError(
                f"The game {filename} has non-zero deltas (they sum to ${game_delta_sum:.2})."
            )

        # Push game
        game_data_list.append(game)

    # Make cumulative sums for player_data_dict
    for player_data in player_data_dict.values():
        sorted_data_points = sorted(player_data, key=itemgetter("date"))

        cum_sum = 0

        for data_point in sorted_data_points:
            cum_sum = round(cum_sum + data_point["delta"], 2)
            data_point["cumSum"] = cum_sum

    return (game_data_list, player_data_dict)


def process_player_matchup_data(
    games_data_list: list[
        dict[str, Union[str, int, list[dict[str, Union[str, float]]]]]
    ],
) -> dict[str, list[dict[str, Union[str, int, float, list[str], list[int]]]]]:
    """Processes stats for each player.

    Args:
      games_data_list: The games data list returned from the raw data
        processing function.

    Returns:
      A dictionary with players as keys and their matchups as values.
      The dictionary has the following structure:

      {
        name:
          [
            {
              player: str,
              players: [ str ],
              gameCount: int,
              cumSum: float
            }
          ]
       }

       The players in each matchup are such that the selected player is
       first, and the rest of the players are sorted alphanumerically;
       the matchups themselves are sorted first by number of games, then
       by absolute value of the cumulative sum for the matchup.
    """
    # This has a different structure from what we'll eventually return.
    # The structure is as follow:
    #
    # {
    #   name:
    #     {
    #       player_name_set:  (this is a frozenset as a key)
    #         {
    #           player: str,
    #           players: [ str ],
    #           gameCount: int,
    #           cumSum: float
    #         }
    #     }
    #  }
    player_matchups_dict = {}

    # Iterate through all games
    for game in games_data_list:
        # Get all players involved in the game
        player_name_list = sorted(
            [player_data["player"] for player_data in game["data"]]
        )
        player_name_set = frozenset(player_name_list)

        # Now iterate through all players and build the player matchups dict
        for player_data in game["data"]:
            player_name = player_data["player"]
            delta = player_data["delta"]

            # Add player to matchups dict if necessary
            if not player_name in player_matchups_dict:
                player_matchups_dict[player_name] = {}

            # Add the data to the player matchups dict
            if player_name_set in player_matchups_dict[player_name]:
                player_matchups_dict[player_name][player_name_set]["gameCount"] += 1
                player_matchups_dict[player_name][player_name_set]["cumSum"] = round(
                    player_matchups_dict[player_name][player_name_set]["cumSum"]
                    + delta,
                    2,
                )
            else:
                # We need to construct the player matchups dict entry
                player_matchups_dict[player_name][player_name_set] = {
                    "player": player_name,
                    "players": player_name_list[:],
                    "gameCount": 1,
                    "cumSum": delta,
                }

    # Sort each player's matchup's players list so that the player is
    # first (the rest are already in alphanumeric order)
    for matchups_dict in player_matchups_dict.values():
        for matchup_dict in matchups_dict.values():
            player = matchup_dict["player"]
            matchup_dict["players"].remove(player)
            matchup_dict["players"].insert(0, player)

    # Now we need to remove the frozenset keys from the player matchups
    # dict (since this will eventually be converted to JSON)
    new_matchups_dict = {
        name: list(matchups_dict.values())
        for name, matchups_dict in player_matchups_dict.items()
    }

    # Now sort the matchups by number of games, then by absolute value
    # of the cumulative sum for the matchup
    for matchup_list in new_matchups_dict.values():
        matchup_list.sort(
            key=lambda x: (x["gameCount"], abs(x["cumSum"])), reverse=True
        )

    return new_matchups_dict


def process_player_stats(
    player_data_dict: dict[str, list[dict[str, Union[str, int, float]]]],
) -> dict[str, dict[str, Union[float, dict[str, Union[int, float]]]]]:
    """Processes stats for each player.

    Args:
      player_data_dict: The player data dict returned from the raw data
        processing function containing game data for each player.

    Returns:
      A dictionary with players as keys and their stats as values. The
      dictionary has the following structure:

      {
        name:
          {
            "total-money-won": float,
            "total-money-lost": float,
            "largest-winning-streak":
              {
                "num-games": int,
                "total": float,
                "start-game-id": int,
                "end-game-id": int,
              },
            "largest-losing-streak":
              {
                "num-games": int,
                "total": float,
                "start-game-id": int,
                "end-game-id": int,
              },
            "most-won-in-single-game":
              {
                "total": float,
                "game-id": int,
              },
            "most-lost-in-single-game":
              {
                "total": float,
                "game-id": int,
              }
          }
      }
    """
    player_stats_dict = {}

    for player_name, data in player_data_dict.items():
        sorted_data_points = sorted(data, key=itemgetter("date"))

        total_money_won = 0
        total_money_lost = 0
        current_winning_streak = None
        current_losing_streak = None
        max_winning_streak = None
        max_losing_streak = None
        most_won_in_single_game = None
        most_lost_in_single_game = None

        # Go through data points
        for data_point in sorted_data_points:
            # Unpack relevant attributes
            game_id = data_point["id"]
            delta = data_point["delta"]

            if delta == 0:
                current_winning_streak = None
                current_losing_streak = None
            elif delta > 0:
                # Add to total money earned
                total_money_won = round(total_money_won + delta, 2)

                # Any losing streak is now dead
                current_losing_streak = None

                # Deal with the streak first
                if current_winning_streak is None:
                    current_winning_streak = {
                        "num-games": 1,
                        "total": delta,
                        "start-game-id": game_id,
                        "end-game-id": game_id,
                    }
                else:
                    current_winning_streak["num-games"] += 1
                    current_winning_streak["total"] = round(
                        current_winning_streak["total"] + delta, 2
                    )
                    current_winning_streak["end-game-id"] = game_id

                if (
                    max_winning_streak is None
                    or current_winning_streak["total"] > max_winning_streak["total"]
                ):
                    max_winning_streak = current_winning_streak

                # Now deal with most money won in a single game
                if (
                    most_won_in_single_game is None
                    or delta > most_won_in_single_game["total"]
                ):
                    most_won_in_single_game = {"total": delta, "game-id": game_id}
            else:
                # Here delta < 0. Mirror the steps for when delta > 0.
                total_money_lost = round(total_money_lost - delta, 2)

                current_winning_streak = None

                if current_losing_streak is None:
                    current_losing_streak = {
                        "num-games": 1,
                        "total": delta,
                        "start-game-id": game_id,
                        "end-game-id": game_id,
                    }
                else:
                    current_losing_streak["num-games"] += 1
                    current_losing_streak["total"] = round(
                        current_losing_streak["total"] + delta, 2
                    )
                    current_losing_streak["end-game-id"] = game_id

                if (
                    max_losing_streak is None
                    or current_losing_streak["total"] < max_losing_streak["total"]
                ):
                    max_losing_streak = current_losing_streak

                if (
                    most_lost_in_single_game is None
                    or delta < most_lost_in_single_game["total"]
                ):
                    most_lost_in_single_game = {"total": delta, "game-id": game_id}

        # Store the stats
        player_stats_dict[player_name] = {
            "total-money-won": total_money_won,
            "total-money-lost": total_money_lost,
            "largest-winning-streak": max_winning_streak,
            "largest-losing-streak": max_losing_streak,
            "most-won-in-single-game": most_won_in_single_game,
            "most-lost-in-single-game": most_lost_in_single_game,
        }

    return player_stats_dict


if __name__ == "__main__":
    # Process raw data
    try:
        game_list, player_dict = process_raw_data()
    except RuntimeError as e:
        # Error in processing data; abort
        print(e)
        print("Aborting.")
        sys.exit(1)

    # Get matchup data
    player_matchup_dict = process_player_matchup_data(game_list)

    # Get player stats
    player_stats_dict = process_player_stats(player_dict)

    # Make final players list
    player_list = []

    for player_name in player_dict:
        player_list.append(
            dict(
                name=player_name,
                colourHex=PLAYER_COLOURS_HEX[player_name.lower()],
                colourRgb=PLAYER_COLOURS_RGB[player_name.lower()],
                avatar=AVATAR_BASE_URL
                + "/"
                + player_name.lower().replace(" ", "_")
                + ".webp",
                gameCount=len(player_dict[player_name]),
                cumSum=player_dict[player_name][-1]["cumSum"],
                matchupData=player_matchup_dict[player_name],
                stats=player_stats_dict[player_name],
                data=player_dict[player_name],
            )
        )

    # Sort players by cumulative sum
    player_list.sort(key=itemgetter("cumSum"), reverse=True)

    # Sort games so newest are first and the deltas are in decreasing order
    for game in game_list:
        game["data"].sort(key=itemgetter("delta"), reverse=True)

    game_list.sort(key=itemgetter("id"), reverse=True)

    # Dump to file
    data = dict(players=player_list, games=game_list)

    with open(OUTFILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    # Dump minified version to file
    with open(OUTFILE_MIN, "w", encoding="utf-8") as f:
        json.dump(data, f)

    # Dump to a JS module
    with open(OUTFILE_MODULE, "w", encoding="utf-8") as f:
        f.write(
            "// This module is generated automatically by the make_data.py script"
            + "\n\n"
            + "const data = "
            + json.dumps(data)
            + ";\n\n"
            + "export { data };"
        )
