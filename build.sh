#!/usr/bin/env bash

npx tsc

if [ $BRANCH != "develop" ] && [ $BRANCH != "main" ]; then
    echo "Skip documentation as branch is not develop and not main (is: ${BRANCH}).";
    exit 0;
fi;


rm -rf ./doc
npx typedoc

npx mocha --reporter mochawesome
mv ./mochawesome-report/mochawesome.html ./mochawesome-report/index.html
mv ./mochawesome-report ./doc/tests

npm run coverage
