#!/usr/bin/env bash

npx rollup ../js/main.js --file ../js/temp.js --format es
npx minify ../js/temp.js > ../js/pokerplots.min.js

rm ../js/temp.js
