#!/bin/bash

find ../MTGODecklistCache/Tournaments -name "modern*.json" '!' -name "modern*league*.json" '!' -name "modern-daily*.json" | sort | xargs -n1 ./insert-tournament-data.sh
psql "$(../get-database-url)" -q < update-nonland-flag.sql