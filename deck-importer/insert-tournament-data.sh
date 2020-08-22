#!/bin/bash

JSON_FILE="$1"

echo "$1"
./json-parser.js "$1" | psql $(../get-database-url.sh) -q