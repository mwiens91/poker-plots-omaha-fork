#!/usr/bin/env node

// This generates colours for players and prints out some corresponding
// Python dictionaries used in the make_data.py script.
import hexRgb from "hex-rgb";
import iwanthue from "iwanthue";

const allPlayers = [
  "aidan",
  "alex",
  "bei",
  "david",
  "jayden",
  "juno",
  "matt",
  "parker",
  "russell",
  "zen",
];
const numPlayers = allPlayers.length;

const paletteHex = iwanthue(numPlayers, {
  clustering: "k-means",
  quality: 100,
});
const paletteRgb = paletteHex.map((x) =>
  hexRgb(x, { format: "array" }).slice(0, -1)
);

const playerColoursHex = Object.fromEntries(
  paletteHex.map((x, i) => [allPlayers[i], x])
);
const playerColoursRgb = Object.fromEntries(
  paletteRgb.map((x, i) => [allPlayers[i], x])
);

// The formatting here isn't perfect, but just run a code formatter on
// it after
console.log("PLAYER_COLOURS_HEX = ", JSON.stringify(playerColoursHex, null, 4));
console.log();
console.log("PLAYER_COLOURS_RGB = ", JSON.stringify(playerColoursRgb, null, 4));
