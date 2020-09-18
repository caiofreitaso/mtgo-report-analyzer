'use strict';

var dbm;
var type;
var seed;

const FUNCTION_NAME = 'view_cards_weighted';

/**
  * We receive the dbmigrate dependency from dbmigrate initially.
  * This enables us to not have to rely on NODE_PATH.
  */
exports.setup = function(options, seedLink) {
  dbm = options.dbmigrate;
  type = dbm.dataType;
  seed = seedLink;
};

exports.up = function(db) {
  return db.runSql(`
CREATE OR REPLACE FUNCTION ${FUNCTION_NAME}(start_time timestamp, end_time timestamp)
RETURNS TABLE(
    card_name decklist.card_name%TYPE,
    metric numeric,
    avr_metric numeric,
    meta_count bigint,
    meta_share numeric
)
LANGUAGE plpgsql AS $$
BEGIN
RETURN QUERY
WITH filter AS (
    SELECT deck.*
    FROM deck
    JOIN tournament
    ON tournament_id = tournament.id
    AND date BETWEEN start_time AND end_time
),
cards AS (
    SELECT
        decklist.card_name,
        SUM(FLOOR(POW(2, 5 - CEIL(GREATEST(1.0,LOG(2, filter.position)))))) AS metric,
        COUNT(*) AS meta_count
    FROM decklist
    JOIN filter
    ON deck_id = filter.id
    WHERE is_nonland_main
    GROUP BY decklist.card_name
),
avr AS (
    SELECT
        *,
        ROUND(cards.metric/cards.meta_count, 3) AS average,
        (SELECT COUNT(*) FROM filter) AS count
    FROM cards
)
SELECT
    avr.card_name,
    avr.metric,
    avr.average AS avr_metric,
    avr.meta_count AS meta_count,
    ROUND(100.0 * avr.meta_count/avr.count,3) AS meta_share
FROM avr
ORDER BY avr_metric DESC;
END;
$$;`);
};

exports.down = function(db) {
  return db.runSql(`DROP FUNCTION ${FUNCTION_NAME}`);
};

exports._meta = {
  "version": 1
};
