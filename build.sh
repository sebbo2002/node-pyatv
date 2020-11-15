#!/usr/bin/env bash

npx tsc

branch=${GITHUB_REF#refs/heads/}
folder="./gh-pages/${branch}"
if [ $branch != "develop" ] && [ $branch != "main" ]; then
    echo "Skip documentation as branch is not develop and not main (is: ${branch}).";
    exit 0;
fi;


rm -rf ./doc
npx typedoc

npx mocha --reporter mochawesome
mv ./mochawesome-report/mochawesome.html ./mochawesome-report/index.html
mv ./mochawesome-report ./doc/tests

npm run coverage

mkdir -p $folder
mv ./doc/* $folder/
rm -rf ./doc
