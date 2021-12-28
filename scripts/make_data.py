#!/usr/bin/env python3

"""
This script generates JSON data using the raw data of Poker Now ledgers
(just copy-pasted). The output JSON has the following structure:

    {
      players:
        [
          {
            name: str,
            colour: str,
            avatar: str,
            gameCount: int,
            cumSum: float,
            data:
              [
                {
                  id: int,
                  date: str,
                  buyin: float,
                  delta: float,
                  cumSum: float
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
AVATAR_DATA_DIR = DATA_DIR + "/avatars"
OUTFILE = DATA_DIR + "/data.json"
OUTFILE_MIN = DATA_DIR + "/data.min.json"

# Colours for players. Try to keep these as distinct as possible.
PLAYER_COLOURS = {
    "aidan": "#191970",
    "alex": "#006400",
    "david": "#ff0000",
    "jayden": "#ffd700",
    "juno": "#00ff00",
    "matt": "#00ffff",
    "russell": "#ff00ff",
    "zen": "#ffb6c1",
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
#           buyin: float,
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
    this_id = current_id
    game = {"id": this_id, "date": date, "data": []}

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

        # Add data for this game dict
        game["data"].append(
            dict(player=player, buyin=player_data[0], delta=player_data[3])
        )

        # Add data for the players dict
        if player not in player_dict:
            player_dict[player] = []

        player_dict[player].append(
            dict(id=this_id, date=date, buyin=player_data[0], delta=player_data[3])
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
            colour=PLAYER_COLOURS[player.lower()],
            avatar=AVATAR_DATA_DIR + "/" + player.lower() + ".webp",
            gameCount=len(player_dict[player]),
            cumSum=player_dict[player][-1]["cumSum"],
            data=player_dict[player],
        )
    )

# Sort players by cumulative sum
players.sort(key=itemgetter("cumSum"), reverse=True)

# Dump to file
with open(OUTFILE, "w") as f:
    json.dump(dict(players=players, games=games), f, indent=2)

# Dump minified version to file
with open(OUTFILE_MIN, "w") as f:
    json.dump(dict(players=players, games=games), f)
