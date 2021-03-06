#!/bin/bash

RESET="$1"

cd MTGODecklistCache
git pull origin master
cd ..

if [ "${RESET}" == "reset" ]
then
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

echo 'select gather_archetypes(250,5);' | psql $(node -e 'console.log(require("./config.js").databaseUrl())')
