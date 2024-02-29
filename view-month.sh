#!/bin/bash

CURRENT_MONTH=$(date +"%Y-%m")
MONTH="${1:-${CURRENT_MONTH}}"
LIMIT="${2:-20}"

FUNCTION="view_meta_trimmed"
# FUNCTION="view_cards_trimmed"

QUERY="SELECT * \
FROM ${FUNCTION}('${MONTH}-01', \
    (date_trunc('month', '${MONTH}-01'::date) + interval '1 month' - interval '1 day')::date) \
WHERE meta_count > 5
ORDER BY avg_metric DESC \
LIMIT ${LIMIT};"

psql $(node -e 'console.log(require("./config.js").databaseUrl())') -c "${QUERY}"
