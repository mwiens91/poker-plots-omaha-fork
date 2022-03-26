#!/usr/bin/env node

// This generates colours for players and prints out some corresponding
// Python dictionaries used in the make_data.py script.
import * as fs from "fs";
import hexRgb from "hex-rgb";
import iwanthue from "iwanthue";

const playerNames = JSON.parse(
  fs.readFileSync("../data/data.json", "utf8")
).players.map((player) => player.name.toLowerCase());
const numPlayers = playerNames.length;

const paletteHex = iwanthue(numPlayers, {
  clustering: "k-means",
  quality: 100,
});
const paletteRgb = paletteHex.map((x) =>
  hexRgb(x, { format: "array" }).slice(0, -1)
);

const playerColoursHex = Object.fromEntries(
  paletteHex.map((x, i) => [playerNames[i], x])
);
const playerColoursRgb = Object.fromEntries(
  paletteRgb.map((x, i) => [playerNames[i], x])
);

// The formatting here isn't perfect, but just run a code formatter on
// it after
console.log("PLAYER_COLOURS_HEX = ", JSON.stringify(playerColoursHex, null, 4));
console.log();
console.log("PLAYER_COLOURS_RGB = ", JSON.stringify(playerColoursRgb, null, 4));
