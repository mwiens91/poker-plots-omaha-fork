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
              ]
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
                  delta: float
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
OUTFILE = DATA_DIR + "/data.json"
OUTFILE_MIN = DATA_DIR + "/data.min.json"

AVATAR_BASE_URL = "https://mwiens91.github.io/poker-plots/data/avatars"
#AVATAR_BASE_URL = DATA_DIR + "/avatars"  # uncomment this to use local avatars

# Colours for players. Try to keep these as distinct as possible. This
# site is good for generating them:
#
# https://medialab.github.io/iwanthue/
#
# The two dictionaries should coincide.
PLAYER_COLOURS_HEX = {
    "aidan": "#4490ff",
    "alex": "#62bc27",
    "david": "#ff4aae",
    "jayden": "#00d0cd",
    "juno": "#db0046",
    "matt": "#588f69",
    "russell": "#ab3200",
    "zen": "#ab7c00",
}
PLAYER_COLOURS_RGB = {
    "aidan": [68, 144, 255],
    "alex": [98, 188, 39],
    "david": [255, 74, 174],
    "jayden": [0, 208, 205],
    "juno": [219, 0, 70],
    "matt": [88, 143, 105],
    "russell": [171, 50, 0],
    "zen": [171, 124, 0],
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
for player in player_dict:
    sorted_data_points = sorted(player_dict[player], key=itemgetter("date"))

    cum_sum = 0

    for data_point in sorted_data_points:
        cum_sum = round(cum_sum + data_point["delta"], 2)
        data_point["cumSum"] = cum_sum

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
with open(OUTFILE, "w") as f:
    json.dump(dict(players=players, games=games), f, indent=2)

# Dump minified version to file
with open(OUTFILE_MIN, "w") as f:
    json.dump(dict(players=players, games=games), f)
