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
      current_archetype archetype.id%TYPE;
      current_median archetype.median_id%TYPE;
  BEGIN
  
  PERFORM id FROM meta WHERE deck_id = target_deck;
  IF FOUND THEN
      RAISE NOTICE 'Deck already has an archetype.';
      RETURN false;
  END IF;
  
  INSERT INTO archetype(median_id)
  VALUES (target_deck)
  RETURNING id
  INTO current_archetype;
  
  RAISE NOTICE '[%] Archetype id: %', current_timestamp, current_archetype;
  
  LOOP
      EXIT WHEN i = iterations;
  
      SELECT median_id
      FROM archetype
      WHERE id = current_archetype
      INTO current_median;
  
      RAISE NOTICE '[%] Current median_id: %', current_timestamp, current_median;
  
      DELETE FROM meta
      WHERE archetype_id = current_archetype;
      RAISE NOTICE '[%] Cleaned decks of current archetype', current_timestamp;
  
      RAISE NOTICE '[%] Starting to add decks near id % (max_dist %)', current_timestamp, current_median, max_distance;
      INSERT INTO meta(archetype_id, deck_id)
      SELECT
          current_archetype,
          id
      FROM deck
      WHERE deck_distance(id, current_median) < max_distance;
      RAISE NOTICE '[%] Done.', current_timestamp;
  
      WITH near_decks
      AS (
          SELECT deck_id AS id
          FROM meta
          WHERE archetype_id = current_archetype
      ),
      distance_graph AS (
          SELECT
              d1.id AS id1,
              d2.id AS id2,
              deck_distance(d1.id, d2.id) AS distance
          FROM near_decks d1
          JOIN near_decks d2
          ON d1.id < d2.id
      )
      SELECT id
      FROM (
          SELECT
              id,
              SUM(distance_graph.distance) AS distance
          FROM near_decks
          JOIN distance_graph
          ON near_decks.id = distance_graph.id1
          OR near_decks.id = distance_graph.id2
          GROUP BY id
          ORDER BY distance
          LIMIT 1
      ) median
      INTO current_median;
  
      UPDATE archetype
      SET median_id = current_median
      WHERE id = current_archetype;
  
      i := i + 1;
  END LOOP;
  
  UPDATE meta
  SET distance = deck_distance(deck_id, current_median)
  WHERE archetype_id = current_archetype;
  
  RETURN true;
  
  END; $$;`);
};

exports.down = function(db) {
  return db.runSql(`DROP FUNCTION ${FUNCTION_NAME}`);
};

exports._meta = {
  "version": 1
};
