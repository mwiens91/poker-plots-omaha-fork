#!/usr/bin/env node

import { writeFile } from "fs";
import { minify } from "html-minifier";
import * as pug from "pug";
import data from "../data/data.json" assert { type: "json" };

// File to write to
const filepath = "../index.html";

// Compile the source code
const compiledFunction = pug.compileFile("../templates/index.pug");

// Compile it with the data
let content = compiledFunction({
  data: data,
});

// Minify it
content = minify(content, {
  removeAttributeQuotes: true,
  removeComments: true,
});

// Save it
writeFile(filepath, content, () => {});
