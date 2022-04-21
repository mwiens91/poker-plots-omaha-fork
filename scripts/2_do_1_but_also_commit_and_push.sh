#!/usr/bin/env bash

if [[ `git status --porcelain --untracked-files=no` ]]; then
  echo "Aborting. There are uncommited changes in this repository."
  exit 1
else
  :
fi

git pull

./1_make_data_and_html_and_min_js.sh

git add ../index.html
git add ../data/raw
git add ../data/data.json
git add ../data/data.min.json
git add ../js/modules/dataModule.mjs
git add ../js/pokerplots.min.js

# The prompt code is thanks to Dennis here:
# https://stackoverflow.com/a/3232082
read -r -p "You are about to push a commit upstream. Is this what you want? [y/N] " response
response=${response,,}    # tolower
if [[ "$response" =~ ^(yes|y)$ ]]
then
  git commit -m "Add new data"
  git push
else
  :
fi
