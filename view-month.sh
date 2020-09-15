#!/bin/bash

CURRENT_MONTH=$(date +"%Y-%m")
MONTH="${1:-${CURRENT_MONTH}}"

psql $(node -e 'console.log(require("./config.js").databaseUrl())') -c "SELECT * FROM view_meta_trimmed('${MONTH}-01', (date_trunc('month', '${MONTH}-01'::date) + interval '1 month' - interval '1 day')::date) LIMIT 20;"
