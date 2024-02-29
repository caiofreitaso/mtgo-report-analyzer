'use strict';

var dbm;
var type;
var seed;

const FUNCTION_NAME = 'view_meta_weighted';

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
    archetype_id meta.archetype_id%TYPE,
    label archetype.label%TYPE,
    metric numeric,
    avg_metric numeric,
    meta_count bigint,
    meta_share numeric
)
LANGUAGE plpgsql AS $$
BEGIN
RETURN QUERY
WITH total AS (
    SELECT COUNT(*)
    FROM meta
    JOIN deck
    ON deck.id = meta.deck_id
    JOIN tournament
    ON deck.tournament_id = tournament.id
    WHERE tournament.date BETWEEN start_time AND end_time
)
SELECT
    archetype.id,
    archetype.label,
    SUM(FLOOR(POW(2, 5 - CEIL(GREATEST(1.0,LOG(2, deck.position)))))) AS metric,
    ROUND(SUM(FLOOR(POW(2, 5 - CEIL(GREATEST(1.0,LOG(2, deck.position))))))/COUNT(*), 3) AS avg_metric,
    COUNT(*) AS meta_count,
    ROUND(100.0 * COUNT(*)/(SELECT count FROM total),3) AS meta_share
FROM meta
JOIN archetype
ON meta.archetype_id = archetype.id
JOIN deck
ON deck.id = meta.deck_id
JOIN tournament
ON deck.tournament_id = tournament.id
WHERE tournament.date BETWEEN start_time AND end_time
GROUP BY archetype.id, archetype.label
ORDER BY metric DESC;
END;
$$;`);
};

exports.down = function(db) {
  return db.runSql(`DROP FUNCTION ${FUNCTION_NAME}`);
};

exports._meta = {
  "version": 1
};
