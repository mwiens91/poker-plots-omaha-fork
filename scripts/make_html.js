#!/usr/bin/env node

const { writeFile } = require("fs");
const pug = require("pug");

// File to write to
const filepath = "../index.html";

// Data
const data = require("../data/data.json");

// Compile the source code
const compiledFunction = pug.compileFile("../templates/index.pug");

// Compile it with the data
const content = compiledFunction({
  data: data,
});

// Save it
writeFile(filepath, content, () => {});
