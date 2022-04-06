# poker-plots scripts

This directory contains a few scripts used to generate code for the
project:

+ [`make_data.py`](make_data.py): generates the data JSON files
  [`../data/data.json`](../data/data.json) and
  [`../data/data.min.json`](../data/data.min.json); and also the data
  module [`../js/modules/dataModule.mjs`](../js/modules/dataModule.mjs)

+ [`make_player_colours.mjs`](make_player_colours.mjs): generates
  colours for the players listed in the data JSON files and inserts the
  player colour data directly into [`make_data.py`](make_data.py)

+ [`process_js.sh`](process_js.sh): bundles and minifies
  [`../js/main.js`](../js/main.js) and its modules into
  [`../js/pokerplots.min.js`](../js/pokerplots.min.js)

+ [`make_html.js`](make_html.js): compiles and minifies the HTML
  template [`../templates/index.pug`](../templates/index.pug), producing
  [`../index.html`](../index.html)

There are also two convenience scripts:

+ [`1_make_data_and_html_and_min_js.sh`](1_make_data_and_html_and_min_js.sh):
  runs [`make_data.py`](make_data.py), [`make_html.js`](make_html.js),
  and [`process_js.sh`](process_js.sh)

+ [`2_do_1_but_also_commit_and_push.sh`](2_do_1_but_also_commit_and_push.sh):
  runs the first convenience script but also commits and pushes the
  files changed as a result of the first script

In order to run the above scripts there are dependencies which are not
explicitly included with the project (`package.json` and
`package-lock.json` are ignored by git). To install these, run the
following at the root of the project:

```
npm install hex-rgb html-minifier iwanthue minify pug rollup
```
