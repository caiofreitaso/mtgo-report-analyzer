#!/bin/bash

RESET="$1"

function databaseUrl() {
  node -e 'console.log(require("./config.js").databaseUrl())'
}

cd MTGODecklistCache
git pull origin master
cd ..

if [ "${RESET}" == "reset" ]
then
    echo 'CREATE DATABASE mtgo_analyzer;' | psql $(databaseUrl | sed 's/mtgo_analyzer//g')
    cd migrate-tool/
    npm start reset
    npm start up
    cd ..

    cd card-importer/
    ./import.sh
    cd ..
fi

cd deck-importer/
./import.sh
cd ..

echo 'SELECT gather_archetypes(250,5);' | psql $(databaseUrl)
