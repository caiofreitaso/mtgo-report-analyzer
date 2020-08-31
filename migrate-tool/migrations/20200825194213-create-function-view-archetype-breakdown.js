'use strict';

var dbm;
var type;
var seed;

const FUNCTION_NAME = 'view_archetype_breakdown';

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
CREATE OR REPLACE FUNCTION ${FUNCTION_NAME}()
RETURNS TABLE(
  archetype_id meta.archetype_id%TYPE,
  label archetype.label%TYPE,
  meta_count bigint,
  max_distance bigint
)
LANGUAGE plpgsql AS $$
BEGIN
RETURN QUERY
SELECT
  archetype.id,
  archetype.label,
  COUNT(*) AS meta_count,
  MAX(distance) AS max_distance
FROM meta
JOIN archetype
ON meta.archetype_id = archetype.id
JOIN deck
ON deck.id = meta.deck_id
JOIN tournament
ON deck.tournament_id = tournament.id
GROUP BY archetype.id, archetype.label
ORDER BY meta_count DESC;
END;
$$;`);
};

exports.down = function(db) {
return db.runSql(`DROP FUNCTION ${FUNCTION_NAME}`);
};

exports._meta = {
  "version": 1
};
