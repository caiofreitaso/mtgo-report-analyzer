#!/bin/bash

cd migrate-tool/
npm start reset
npm start up
cd ..

cd card-importer/
./import.sh
cd ..

cd deck-importer/
./import.sh
cd ..

echo 'select gather_archetypes();' | psql "$(./get-database-url.sh)"