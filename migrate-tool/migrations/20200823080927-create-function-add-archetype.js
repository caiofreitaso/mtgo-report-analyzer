'use strict';

var dbm;
var type;
var seed;

const FUNCTION_NAME = 'add_archetype';

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
CREATE OR REPLACE FUNCTION ${FUNCTION_NAME}(target_deck INT, iterations INT, max_distance BIGINT)
RETURNS bool
LANGUAGE plpgsql AS $$
DECLARE
    i INT := 0;
    is_another_archetype BOOL := false;
    current_archetype archetype.id%TYPE;
    current_median archetype.medoid_id%TYPE;
BEGIN

PERFORM id FROM meta WHERE deck_id = target_deck;
IF FOUND THEN
    RETURN false;
END IF;

INSERT INTO archetype(medoid_id)
VALUES (target_deck)
RETURNING id
INTO current_archetype;
RAISE NOTICE '[%] Archetype id: %', clock_timestamp(), current_archetype;

LOOP
    EXIT WHEN i = iterations;

    SELECT medoid_id
    FROM archetype
    WHERE id = current_archetype
    INTO current_median;
    RAISE NOTICE '[%] Current medoid_id: %', clock_timestamp(), current_median;

    DELETE FROM meta
    WHERE archetype_id = current_archetype;

    INSERT INTO meta(archetype_id, deck_id)
    SELECT
        current_archetype,
        id
    FROM deck
    WHERE deck_distance(id, current_median) < max_distance;
    RAISE NOTICE '[%] Decks added.', clock_timestamp();

    SELECT get_medoid(current_archetype)
    INTO current_median;

    IF NOT FOUND THEN
        RAISE NOTICE '[%] Only one deck', clock_timestamp();
        current_median := target_deck;
        EXIT;
    END IF;

    EXIT WHEN current_median = (SELECT medoid_id
    FROM archetype
    WHERE id = current_archetype
    AND medoid_id = current_median);

    PERFORM medoid_id
    FROM archetype
    WHERE id <> current_archetype
    AND medoid_id = current_median;

    is_another_archetype := FOUND;

    EXIT WHEN is_another_archetype;

    UPDATE archetype
    SET medoid_id = current_median
    WHERE id = current_archetype;

    i := i + 1;
END LOOP;

IF is_another_archetype THEN
    RAISE NOTICE '[%] Archetype already exists. Reducing reach...', clock_timestamp();
    DELETE FROM meta WHERE archetype_id = current_archetype;
    DELETE FROM archetype WHERE id = current_archetype;
    RETURN add_archetype(target_deck, iterations, max_distance/2);
ELSE
    UPDATE meta
    SET distance = deck_distance(deck_id, current_median)
    WHERE archetype_id = current_archetype;
    RAISE NOTICE '[%] Final median: %', clock_timestamp(), current_median;
    
    RETURN true;
END IF;

END; $$;`);
};

exports.down = function(db) {
  return db.runSql(`DROP FUNCTION ${FUNCTION_NAME}`);
};

exports._meta = {
  "version": 1
};
