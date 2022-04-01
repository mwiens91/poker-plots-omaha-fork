#!/usr/bin/env node

// This generates colours for players and inserts the colour data as
// Python dictionaries into the make_data.py script
import { exec } from "child_process";
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

// Insert the colour data into the make_data script
const coloursHexReplacement =
  "PLAYER_COLOURS_HEX = " + JSON.stringify(playerColoursHex);
const coloursRgbReplacement =
  "PLAYER_COLOURS_RGB = " + JSON.stringify(playerColoursRgb);

const getAwkScript = (isHex) =>
  "/PLAYER_COLOURS_" +
  (isHex ? "HEX" : "RGB") +
  "[[:space:]]=[[:space:]]\\{/{f=1}" +
  " !f{print}" +
  " /}/{if (f==1) {print x;}; f=0}";

exec(
  `awk -v x='${coloursHexReplacement}' '${getAwkScript(
    true
  )}' make_data.py > temp.py`
);
exec(
  `awk -v x='${coloursRgbReplacement}' '${getAwkScript(
    false
  )}' temp.py > make_data.py`
);
exec('rm temp.py');

// Add back in executable permission and format code
exec("chmod +x make_data.py");
exec("black make_data.py");
