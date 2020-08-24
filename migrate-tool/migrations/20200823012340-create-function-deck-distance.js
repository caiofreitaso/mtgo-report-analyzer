'use strict';

var dbm;
var type;
var seed;

const FUNCTION_NAME = 'deck_distance';

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
CREATE OR REPLACE FUNCTION ${FUNCTION_NAME}(deck_1 int, deck_2 int)
RETURNS bigint
AS $$
WITH
nonland AS (
    SELECT
        deck_id,
        card_name,
        quantity
    FROM decklist
    WHERE (deck_id = deck_1
    OR deck_id = deck_2)
    AND is_nonland_main
),
decklist_1 AS (
    SELECT
      card_name,
      quantity
    FROM nonland
    WHERE deck_id = deck_1
),
decklist_2 AS (
    SELECT
      card_name,
      quantity
    FROM nonland
    WHERE deck_id = deck_2
)
SELECT
    COALESCE(SUM(a.diff),0) AS distance
FROM (
    SELECT
        d1.card_name,
        ABS(d1.quantity - d2.quantity) AS diff
    FROM decklist_1 d1
    JOIN decklist_2 d2
    ON d1.card_name = d2.card_name
    AND d1.quantity <> d2.quantity

    UNION ALL
    SELECT
        card_name,
        quantity AS diff
    FROM nonland
    WHERE card_name NOT IN (
        SELECT card_name
        FROM decklist_2
    )

    UNION ALL
    SELECT
        card_name,
        quantity AS diff
    FROM nonland
    WHERE card_name NOT IN (
        SELECT card_name
        FROM decklist_1
    )
) a
$$ LANGUAGE SQL;`);
};

exports.down = function(db) {
  return db.runSql(`DROP FUNCTION ${FUNCTION_NAME}`);
};

exports._meta = {
  "version": 1
};
