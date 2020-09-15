#!/bin/bash

find ../MTGODecklistCache/Tournaments \
    -name "modern*.json" \
    '!' -name "modern*league*.json" \
    '!' -name "modern-daily*.json" \
| sort \
> all-tournaments.txt

psql "$(../get-database-url.sh)" -AtF"," -c \
    "SELECT LTRIM(filename) FROM tournament;" \
| sort \
> inserted-tournaments.txt

comm -23 all-tournaments.txt inserted-tournaments.txt \
| sort \
| xargs -n1 ./insert-tournament-data.sh

psql "$(../get-database-url.sh)" -q < update-nonland-flag.sql