'use strict';

var dbm;
var type;
var seed;

const FUNCTION_NAME = 'get_medoid';

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
CREATE OR REPLACE FUNCTION ${FUNCTION_NAME}(target_archetype int)
RETURNS int
LANGUAGE plpgsql AS $$
DECLARE
    current_medoid int;
BEGIN
    WITH near_decks
    AS (
        SELECT deck_id AS id
        FROM meta
        WHERE archetype_id = target_archetype
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
    ) medoid
    INTO current_medoid;

    RETURN current_medoid;
END;
$$;`);
};

exports.down = function(db) {
  return db.runSql(`DROP FUNCTION ${FUNCTION_NAME}`);
};

exports._meta = {
  "version": 1
};
