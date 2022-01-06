#!/usr/bin/env node

const { writeFile } = require("fs");
const minify = require("html-minifier").minify;
const pug = require("pug");

// File to write to
const filepath = "../index.html";

// Data
const data = require("../data/data.json");

// Compile the source code
const compiledFunction = pug.compileFile("../templates/index.pug");

// Compile it with the data
let content = compiledFunction({
  data: data,
});

// Minify it
content = minify(content, {
  collapseInlineTagWhitespace: true,
  collapseWhitespace: true,
  removeAttributeQuotes: true,
  removeComments: true,
});

// Save it
writeFile(filepath, content, () => {});
