'use strict';

var dbm;
var type;
var seed;

const FUNCTION_NAME = 'gather_archetypes';

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
CREATE OR REPLACE FUNCTION gather_archetypes(max_distance bigint, max_iterations int)
RETURNS BOOL
LANGUAGE plpgsql AS $$
DECLARE
    success bool := true;
BEGIN

WHILE success
LOOP
    SELECT bool_or(add_archetype(id, max_iterations, max_distance))
    FROM deck
    INTO success;
END LOOP;
RAISE NOTICE '[%] Finished basic archetype gathering', clock_timestamp();

UPDATE meta
SET archetype_id = (
    SELECT id
    FROM archetype
    ORDER BY deck_distance(archetype.medoid_id, deck_id)
    LIMIT 1
);
RAISE NOTICE '[%] Update decks archetypes', clock_timestamp();

UPDATE meta
SET distance = deck_distance(deck_id, (
  SELECT medoid_id
  FROM archetype
  WHERE id = archetype_id)
);
RAISE NOTICE '[%] Update decks distances', clock_timestamp();

DELETE FROM meta
WHERE id IN (
    SELECT m1.id
    FROM meta m1, meta m2
    WHERE m1.deck_id = m2.deck_id
    AND m1.archetype_id = m2.archetype_id
    AND m1.id > m2.id
);
RAISE NOTICE '[%] Done updating', clock_timestamp();

RETURN true;
END;
$$;`);
};

exports.down = function(db) {
  return db.runSql(`DROP FUNCTION ${FUNCTION_NAME}`);
};

exports._meta = {
  "version": 1
};
