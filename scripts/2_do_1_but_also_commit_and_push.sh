#!/usr/bin/env bash

git stash
git pull
git stash pop

./1_make_data_and_html.sh

git add ../index.html
git add ../data/raw
git add ../data/data.json
git add ../data/data.min.json

git commit -m "Add new data"
git push
