#!/bin/bash
set -e

MTG_MODERN_SETS=(
"MH1"

"8ED"
"9ED"
"10E"
"M10"
"M11"
"M12"
"M13"
"M14"
"M15"
"ORI"
"M19"
"M20"
"M21"

"MRD"
"DST"
"5DN"
"CHK"
"BOK"
"SOK"
"RAV"
"GPT"
"DIS"
"CSP"
"TSP"
"TSB"
"PLC"
"FUT"
"LRW"
"MOR"
"SHM"
"EVE"
"ALA"
"CON_"
"ARB"
"ZEN"
"WWK"
"ROE"
"SOM"
"MBS"
"NPH"
"ISD"
"DKA"
"AVR"
"RTR"
"GTC"
"DGM"
"THS"
"BNG"
"JOU"
"KTK"
"FRF"
"DTK"
"BFZ"
"OGW"
"SOI"
"EMN"
"KLD"
"AER"
"AKH"
"HOU"
"XLN"
"RIX"
"DOM"
"GRN"
"RNA"
"WAR"
"ELD"
"THB"
"IKO"
)

CARD_JQ_FILTER="$(cat card-values.jq)"
DATABASE_URL="$(../get-database-url.sh)"

echo [Basic Lands]
psql "${DATABASE_URL}" < basic-lands.sql

for SET in "${MTG_MODERN_SETS[@]}"
do
  echo [${SET}]

  if [ ! -f ./${SET}.json ]
  then
  curl -s https://mtgjson.com/api/v5/${SET}.json?a > ${SET}.json
  fi

  cat ${SET}.json | jq "${CARD_JQ_FILTER}" -r | psql "${DATABASE_URL}"
done
