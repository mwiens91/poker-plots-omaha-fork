#!/usr/bin/env bash

git pull

./1_make_data_and_html.sh

git add ../index.html
git add ../data

git commit -m "Add new data"
git push
