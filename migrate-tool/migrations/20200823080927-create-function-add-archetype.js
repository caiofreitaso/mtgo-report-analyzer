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
CREATE OR REPLACE FUNCTION add_archetype(target_deck INT, iterations INT, max_distance BIGINT)
RETURNS bool
LANGUAGE plpgsql AS $$
DECLARE
    i INT := 0;
    is_another_archetype BOOL := false;
    current_archetype archetype.id%TYPE;
    current_medoid archetype.medoid_id%TYPE;
BEGIN

PERFORM id FROM meta WHERE deck_id = target_deck;
IF FOUND THEN
    RETURN false;
END IF;

RAISE NOTICE '[%] New archetype for %', clock_timestamp(), target_deck;

SELECT id
FROM archetype
WHERE deck_distance(target_deck, medoid_id) <= max_distance
ORDER BY deck_distance(target_deck, medoid_id)
LIMIT 1
INTO current_archetype;

IF current_archetype IS NOT NULL
THEN
    INSERT INTO meta(archetype_id, deck_id)
    VALUES (current_archetype, target_deck);

    SELECT get_medoid(current_archetype)
    INTO current_medoid;
ELSE
    INSERT INTO archetype(medoid_id)
    VALUES (target_deck)
    RETURNING id
    INTO current_archetype;
END IF;

LOOP
    EXIT WHEN i = iterations;

    SELECT medoid_id
    FROM archetype
    WHERE id = current_archetype
    INTO current_medoid;

    DELETE FROM meta
    WHERE archetype_id = current_archetype;

    INSERT INTO meta(archetype_id, deck_id)
    SELECT
        current_archetype,
        id
    FROM deck
    WHERE deck_distance(id, current_medoid) <= max_distance
    AND id NOT IN (SELECT deck_id FROM meta);

    SELECT get_medoid(current_archetype)
    INTO current_medoid;

    IF current_medoid IS NULL THEN
        current_medoid := target_deck;
        EXIT;
    END IF;

    EXIT WHEN current_medoid = (SELECT medoid_id
        FROM archetype
        WHERE id = current_archetype
        AND medoid_id = current_medoid);

    is_another_archetype := (0 = (SELECT deck_distance(medoid_id,current_medoid)
        FROM archetype
        WHERE id <> current_archetype
        ORDER BY deck_distance
        LIMIT 1));

    EXIT WHEN is_another_archetype;

    UPDATE archetype
    SET medoid_id = current_medoid
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
    SET distance = deck_distance(deck_id, current_medoid)
    WHERE archetype_id = current_archetype;
    RAISE NOTICE '[%] Final medoid: %', clock_timestamp(), current_medoid;
    
    RETURN true;
END IF;
END;
$$;`);
};

exports.down = function(db) {
  return db.runSql(`DROP FUNCTION ${FUNCTION_NAME}`);
};

exports._meta = {
  "version": 1
};
