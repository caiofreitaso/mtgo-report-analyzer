#!/bin/bash
set -e

DATABASE_URL=$(node -e 'console.log(require("./config.js").databaseUrl())')
PSQL="psql ${DATABASE_URL} -t -c"
DATES=( $(${PSQL} "SELECT DISTINCT date FROM tournament WHERE date > '2019-10-14' ORDER BY date") )
FROM_VIEW="FROM view_cards_weighted((SELECT * FROM targetdate) - interval '14 days',(SELECT * FROM targetdate))"
SELECT_CARDNAME="SELECT card_name ${FROM_VIEW} WHERE meta_share > 13"
SELECT_METRIC="SELECT coalesce(metric,0) ${FROM_VIEW}"
CARD_FILE=cards.txt
FORMATTED_CARD_FILE=unique.txt
CSV_FILE=timeline.csv
TMP_FILE=tmp.txt

echo "Fetching card names (meta_share > 13%)..."
echo "" > $CARD_FILE
for date in "${DATES[@]}"
do
	$PSQL "WITH targetdate AS (SELECT '${date}'::date date) ${SELECT_CARDNAME}" >> $CARD_FILE
	#filter unique
	cat $CARD_FILE | grep . | sort | uniq > $TMP_FILE
	cat $TMP_FILE > $CARD_FILE
done
awk 'NF {gsub(/'"'"'/, "'"''"'"); gsub(/(^ | $)/, ""); print "'"'"'" $0 "'"'"'"}' $CARD_FILE > $FORMATTED_CARD_FILE
echo "Fecthed."

echo "Fetching card metrics..."
readarray CARD_NAMES < $CARD_FILE
readarray FORMATTED_CARD_NAMES < $FORMATTED_CARD_FILE
ARRAY_NAMES=$(IFS=, ; echo "${FORMATTED_CARD_NAMES[*]}")
RIGHT_JOIN="RIGHT JOIN (SELECT unnest(ARRAY[${ARRAY_NAMES}])) a ON a.unnest = card_name"
echo "Date, $(IFS=, ; echo "${CARD_NAMES[*]}")" > $CSV_FILE
for date in "${DATES[@]}"
do
	COMMAND="WITH targetdate AS (SELECT '${date}'::date date) ${SELECT_METRIC} ${RIGHT_JOIN} ORDER BY a.unnest"
	echo "${COMMAND}"
	METRIC=( $($PSQL "${COMMAND}") )
	echo $date, $(IFS=, ; echo "${METRIC[*]}") >> $CSV_FILE
done
echo "Done."