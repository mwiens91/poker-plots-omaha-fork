#!/usr/bin/env node

// This generates colours for players and inserts the colour data as
// Python dictionaries into the make_data.py script
import { exec } from "child_process";
import * as fs from "fs";
import hexRgb from "hex-rgb";
import iwanthue from "iwanthue";
import * as path from "path";

// Get player names and order from raw data files
const rawDataDirPath = "../data/raw/";
const playersWithCumSum = {};

fs.readdirSync(rawDataDirPath).forEach((file) => {
  const fullFilePath = path.join(rawDataDirPath, file);

  // Read the files
  const fullText = fs.readFileSync(fullFilePath, "utf8");
  const lines = fullText.split(/[\r\n]+/).filter((line) => line);

  // Read the data. We need to support both Firefox and Chrome here.
  // The formatting of the copy-paste is browser dependent, see comments
  // in make_data.py for a more thorough description.
  const isFirefoxFormat =
    lines[0]
      .match(/@(.*?)$/)[1]
      .trim()
      .split(/\s+/).length === 1;

  // Loop increment
  let di;

  if (isFirefoxFormat) {
    di = 2;
  } else {
    di = 1;
  }

  for (let i = 0; i < lines.length; i += di) {
    const playerName = lines[i].split(/\s+/)[0].toLowerCase();
    const net = parseFloat(lines[i + di - 1].split(/\s+/).at(-1));

    if (playerName in playersWithCumSum) {
      playersWithCumSum[playerName] += net;
    } else {
      playersWithCumSum[playerName] = net;
    }
  }
});

// Get the player names in order of cumulative sum (descending)
const playerNames = Object.keys(playersWithCumSum);
playerNames.sort((a, b) =>
  playersWithCumSum[a] > playersWithCumSum[b] ? -1 : 1
);

const numPlayers = playerNames.length;

// Get the colours
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
