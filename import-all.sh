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

