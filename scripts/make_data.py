#!/usr/bin/env python3

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
                  },
              },
          }
        ]
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

# Initialize list of games with the following structure
#   [
#     {
#       id: int,
#       date: str,
#       data:
#         [
#           {
#             player: str,
#             buyin: float,
#             buyout: float,
#             delta: float
#           }
#         ]
#     }
#   ]
games = []

# Initialize dict of player data with the following structure
#   {
#     name:
#       [
#         {
#           id: int,
#           date: str,
#           player: str,
#           buyin: float,
#           buyout: float,
#           delta: float,
#         }
#       ]
#   }
player_dict = {}

# Get all raw data file paths
raw_data_files = sorted([f for f in os.listdir(RAW_DATA_DIR) if f[-3:] == "txt"])

# Start game ID counter
current_id = 1

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
        player = l1.split()[0].lower().title()
        player_data = [float(x) for x in l2.split("\t")]

        # Parse data
        buyin = player_data[0]
        buyout = player_data[1] + player_data[2]
        delta = player_data[3]

        # Add data for this game dict
        game["data"].append(
            dict(player=player, buyin=buyin, buyout=buyout, delta=delta)
        )

        # Add data for the players dict
        if player not in player_dict:
            player_dict[player] = []

        player_dict[player].append(
            dict(
                id=game_id,
                date=date,
                player=player,
                buyin=buyin,
                buyout=buyout,
                delta=delta,
            )
        )

    # Push game
    games.append(game)

# Make cumulative sums for player_dict
for player, data in player_dict.items():
    sorted_data_points = sorted(data, key=itemgetter("date"))

    cum_sum = 0

    for data_point in sorted_data_points:
        cum_sum = round(cum_sum + data_point["delta"], 2)
        data_point["cumSum"] = cum_sum


# Get stats for players
player_stats_dict = {}

for player, data in player_dict.items():
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
    player_stats_dict[player] = {
        "total-money-won": total_money_won,
        "total-money-lost": total_money_lost,
        "largest-winning-streak": max_winning_streak,
        "largest-losing-streak": max_losing_streak,
        "most-won-in-single-game": most_won_in_single_game,
        "most-lost-in-single-game": most_lost_in_single_game,
    }

# Make final players list
players = []

for player in player_dict:
    players.append(
        dict(
            name=player,
            colourHex=PLAYER_COLOURS_HEX[player.lower()],
            colourRgb=PLAYER_COLOURS_RGB[player.lower()],
            avatar=AVATAR_BASE_URL + "/" + player.lower() + ".webp",
            gameCount=len(player_dict[player]),
            cumSum=player_dict[player][-1]["cumSum"],
            stats=player_stats_dict[player],
            data=player_dict[player],
        )
    )

# Sort players by cumulative sum
players.sort(key=itemgetter("cumSum"), reverse=True)

# Sort games so newest are first and the deltas are in decreasing order
for game in games:
    game["data"].sort(key=itemgetter("delta"), reverse=True)

games.sort(key=itemgetter("id"), reverse=True)

# Dump to file
data = dict(players=players, games=games)

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
