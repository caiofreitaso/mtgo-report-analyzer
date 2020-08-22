#!/bin/bash

find ../MTGODecklistCache/Tournaments -name "modern*.json" '!' -name "modern-league*.json" | sort | xargs -n1 ./insert-tournament-data.sh