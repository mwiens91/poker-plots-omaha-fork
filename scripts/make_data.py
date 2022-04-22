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
                  colourHex: str,
                  colourRgb: [ int ],
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
import math
from operator import itemgetter
import os
import statistics
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
    "matt": "#c77aa5",
    "aidan": "#7fba46",
    "russell": "#7a64ca",
    "jayden": "#be4daa",
    "zen": "#d5a73c",
    "parker": "#5abb94",
    "josh": "#537c37",
    "alex": "#c84461",
    "david": "#6991ce",
    "bei": "#a68346",
    "juno": "#cc603e",
}
PLAYER_COLOURS_RGB = {
    "matt": [199, 122, 165],
    "aidan": [127, 186, 70],
    "russell": [122, 100, 202],
    "jayden": [190, 77, 170],
    "zen": [213, 167, 60],
    "parker": [90, 187, 148],
    "josh": [83, 124, 55],
    "alex": [200, 68, 97],
    "david": [105, 145, 206],
    "bei": [166, 131, 70],
    "juno": [204, 96, 62],
}


def convert_rgb_to_hex(rgb: list[int]) -> str:
    """Converts RGB values to a hex string.

    Args:
      rgb: A list containing RGB values.

    Returns:
      The hex string associated with the passed in RGB values.
    """
    return "#%02x%02x%02x" % tuple(rgb)


def average_rgb_colours(
    colours: list[list[int]], correct_method: bool = True
) -> list[int]:
    """Averages colours.

    This takes the average of the colour components of the passed in colours.

    Args:
      colours: A list of colour lists containing RGB values.
      correct_method: Determines whether to use the "correct" way
        of averaging colours. The correct way is to take the average of
        the squares of each colour's component, and take the square root
        of the result. If this argument is false, we simply take the
        arithmetic mean of each component when averaging colours.

    Returns:
      The average of the colours using the method specified.
    """
    # Construct a three-element list where each element contains a list
    # of one the colour components (RGB) of the passed in colours
    combined_rgb_list = [[colour[idx] for colour in colours] for idx in range(3)]

    # Average the colours
    if correct_method:
        return [
            int(math.sqrt(statistics.mean([x ** 2 for x in combined_rgb_list[idx]])))
            for idx in range(3)
        ]

    # Use naive method
    return [int(statistics.mean(combined_rgb_list[idx])) for idx in range(3)]


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
      RuntimeError: A player name not found in the player colour
        dictionaries was encountered in the raw data.
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

        # Increment the current game ID
        current_id += 1

        # Get lines from the raw data file
        path = os.path.join(RAW_DATA_DIR, filename)

        with open(path) as f:
            lines = [l.rstrip() for l in f.readlines()]

        # Go through the lines pairwise and get player data
        for l1, l2 in zip(*[iter(lines)] * 2):
            # Parse the lines
            player_name_raw = l1.split()[0]
            player_name = player_name_raw.lower().title()
            player_data = [float(x) for x in l2.split("\t")]

            buyin = player_data[0]
            buyout = player_data[1] + player_data[2]
            delta = player_data[3]

            # Make sure player is valid; if not, raise an exception
            if not player_name in valid_player_names:
                raise RuntimeError(
                    'Invalid player name "%s" encounted in %s.'
                    % (player_name_raw, filename)
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
    use_correct_colour_average: bool = True,
) -> dict[str, list[dict[str, Union[str, int, float, list[str], list[int]]]]]:
    """Processes stats for each player.

    Args:
      games_data_list: The games data list returned from the raw data
        processing function.
      use_correct_colour_average: Determines whether to use the
        "correct" way of averaging colours. The correct way involves
        squaring each colour component prior to averaging them, and then
        taking the square root of the result. This link explains the
        method much better:

        https://sighack.com/post/averaging-rgb-colors-the-right-way

        (or just Google "how to average colours correctly" and you'll
        get lots of results). If this argument is false, then we will
        take the naive approach of simply take the average of each
        colour component when averaging colours.

    Returns:
      A dictionary with players as keys and their matchups as values.
      The dictionary has the following structure:

      {
        name:
          [
            {
              player: str,
              players: [ str ],
              colourHex: str,
              colourRgb: [ int ],
              gameCount: int,
              cumSum: float
            }
          ]
       }

       The players in each matchup are sorted alphanumerically; the
       matchups themselves are not sorted.
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
    #           colourHex: str,
    #           colourRgb: [ int ],
    #           gameCount: int,
    #           cumSum: float
    #         }
    #     }
    #  }
    player_matchups_dict = {}

    # Will contain frozensets of player matchups as keys and colours as
    # values
    matchup_colours_hex_dict = {}
    matchup_colours_rgb_dict = {}

    # Iterate through all games
    for game in games_data_list:
        # Get all players involved in the game
        player_name_list = sorted(
            [player_data["player"] for player_data in game["data"]]
        )
        player_name_set = frozenset(player_name_list)

        # Get the colour for the matchup
        if player_name_set in matchup_colours_hex_dict:
            matchup_colour_hex = matchup_colours_hex_dict[player_name_set]
            matchup_colour_rgb = matchup_colours_rgb_dict[player_name_set]
        else:
            # Calculate the colours for the matchup
            matchup_colour_rgb = average_rgb_colours(
                [
                    PLAYER_COLOURS_RGB[player_name.lower()]
                    for player_name in player_name_list
                ],
                use_correct_colour_average,
            )
            matchup_colour_hex = convert_rgb_to_hex(matchup_colour_rgb)

            # Assign them in the dictionary
            matchup_colours_hex_dict[player_name_set] = matchup_colour_hex
            matchup_colours_rgb_dict[player_name_set] = matchup_colour_rgb

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
                    "players": player_name_list,
                    "colourHex": matchup_colour_hex,
                    "colourRgb": matchup_colour_rgb,
                    "gameCount": 1,
                    "cumSum": delta,
                }

    # Now we need to remove the frozenset keys from the player matchups
    # dict and return the result
    return {
        name: list(matchup_dict.values())
        for name, matchup_dict in player_matchups_dict.items()
    }


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
    player_matchup_dict = process_player_matchup_data(
        game_list, use_correct_colour_average=True
    )

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
                avatar=AVATAR_BASE_URL + "/" + player_name.lower() + ".webp",
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

    with open(OUTFILE, "w") as f:
        json.dump(data, f, indent=2)

    # Dump minified version to file
    with open(OUTFILE_MIN, "w") as f:
        json.dump(data, f)

    # Dump to a JS module
    with open(OUTFILE_MODULE, "w") as f:
        f.write(
            "// This module is generated automatically by the make_data.py script"
            + "\n\n"
            + "const data = "
            + json.dumps(data)
            + ";\n\n"
            + "export { data };"
        )
