#!/bin/bash

JSON_FILE="$1"

if [ -n "${JSON_FILE}" ]
then
    echo "${JSON_FILE}"
    ./json-parser.js "${JSON_FILE}" | psql $(../get-database-url.sh) -q
fi