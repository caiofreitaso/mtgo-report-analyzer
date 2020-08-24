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
CREATE OR REPLACE FUNCTION ${FUNCTION_NAME}()
RETURNS BOOL
LANGUAGE plpgsql AS $$
DECLARE
    max_distance bigint := 32;
    max_iterations int := 5;
    success bool := true;
    it_id int;
BEGIN

WHILE success
LOOP
    SELECT bool_or(add_archetype(id, max_iterations, max_distance))
    FROM deck
    INTO success;
END LOOP;
RAISE NOTICE '[%] Finished basic archetype gathering', clock_timestamp();

CREATE TEMPORARY TABLE unique_archetype (
    archetype_id int
) ON COMMIT DROP;
CREATE TEMPORARY TABLE graph (
    id1 int,
    id2 int,
    deck_distance bigint
) ON COMMIT DROP;
CREATE TEMPORARY TABLE overlapping (
    id1 int,
    id2 int,
    deck_distance bigint
) ON COMMIT DROP;

WITH meta_count AS (
    SELECT
        archetype_id,
        COUNT(*)
    FROM meta
    GROUP BY archetype_id
)
INSERT INTO unique_archetype (archetype_id)
SELECT archetype_id
FROM meta_count
WHERE count = 1;

INSERT INTO graph(
    id1,
    id2,
    deck_distance
)
SELECT
    a1.id AS id1,
    a2.id AS id2,
    deck_distance(a1.medoid_id, a2.medoid_id)
FROM archetype a1,
archetype a2
WHERE a1.id < a2.id;
RAISE NOTICE '[%] Complete medoid distance graph', clock_timestamp();

-- Remove non-unique medoids too close to each other (distance IN [0,1])
-- Use the older one
INSERT INTO overlapping (
    id1,
    id2,
    deck_distance
)
SELECT
    id1,
    id2,
    deck_distance
FROM graph
WHERE id1 NOT IN (SELECT * FROM unique_archetype)
AND id2 NOT IN (SELECT * FROM unique_archetype)
AND deck_distance < 2;
RAISE NOTICE '[%] Get close medoids', clock_timestamp();

UPDATE meta
SET
    archetype_id = overlapping.id1,
    distance = deck_distance(deck_id, (SELECT medoid_id FROM archetype WHERE id = overlapping.id1))
FROM overlapping
WHERE meta.archetype_id = overlapping.id2;
RAISE NOTICE '[%] Updated meta', clock_timestamp();

DELETE FROM archetype
WHERE id IN (SELECT id2 FROM overlapping);
RAISE NOTICE '[%] Deleted new archetypes', clock_timestamp();

DELETE FROM graph
WHERE id1 IN (SELECT id2 FROM overlapping)
OR id2 IN (SELECT id2 FROM overlapping);
RAISE NOTICE '[%] Deleted graph references', clock_timestamp();

DELETE FROM overlapping;
RAISE NOTICE '[%] Clean overlapping', clock_timestamp();

-- Remove the unique medoids within stablished archetypes (distance < max_distance)
-- Use the closest one
WITH singles AS (
    SELECT *
    FROM graph
    WHERE id1 NOT IN (SELECT * FROM unique_archetype)
    AND id2 IN (SELECT * FROM unique_archetype)
    AND deck_distance < max_distance
)
INSERT INTO overlapping (
    id1,
    id2,
    deck_distance
)
SELECT
    s1.id1,
    s1.id2,
    s1.deck_distance
FROM singles s1
JOIN (
    SELECT
        id2,
        MIN(deck_distance)
    FROM singles
    GROUP BY id2) s2
ON s1.id2 = s2.id2
AND s1.deck_distance = s2.min;
RAISE NOTICE '[%] Get unique medoids', clock_timestamp();

UPDATE meta
SET
    archetype_id = overlapping.id1,
    distance = deck_distance(deck_id, (SELECT medoid_id FROM archetype WHERE id = overlapping.id1))
FROM overlapping
WHERE meta.archetype_id = overlapping.id2;
RAISE NOTICE '[%] Updated meta', clock_timestamp();

DELETE FROM archetype
WHERE id IN (SELECT id2 FROM overlapping);
RAISE NOTICE '[%] Deleted unique archetypes', clock_timestamp();

DELETE FROM graph
WHERE id1 IN (SELECT id2 FROM overlapping)
OR id2 IN (SELECT id2 FROM overlapping);
RAISE NOTICE '[%] Deleted graph references', clock_timestamp();

DELETE FROM unique_archetype
WHERE archetype_id IN (SELECT id2 FROM overlapping);
RAISE NOTICE '[%] Deleted archetypes as unique', clock_timestamp();

DELETE FROM overlapping;
RAISE NOTICE '[%] Clean overlapping', clock_timestamp();

RAISE NOTICE '[%] Start merging', clock_timestamp();
-- Start to merge close archetypes
LOOP
    -- Get mutual closest archetypes
    WITH expanded_graph AS (
        SELECT *
        FROM graph
        UNION ALL
        SELECT
            id2 AS id1,
            id1 AS id2,
            deck_distance
        FROM graph
    ), 
    min_distance AS (
        SELECT
            id1 AS id,
            MIN(deck_distance) AS distance
        FROM expanded_graph
        GROUP BY id1
    ),
    closest AS (
        SELECT
            expanded_graph.*
        FROM expanded_graph
        JOIN min_distance
        ON expanded_graph.id1 = min_distance.id
        AND expanded_graph.deck_distance = min_distance.distance
    )
    INSERT INTO overlapping (
        id1,
        id2,
        deck_distance
    )
    SELECT
        c1.id1,
        c1.id2,
        c1.deck_distance
    FROM closest c1
    JOIN closest c2
    ON c1.id1 = c2.id2
    AND c1.id2 = c2.id1
    WHERE c1.id1 < c1.id2
    AND c1.deck_distance < (3 * max_distance / 4);
    RAISE NOTICE '[%] Get close medoids', clock_timestamp();

    EXIT WHEN (SELECT COUNT(*) FROM overlapping) = 0;

    UPDATE meta
    SET
        archetype_id = overlapping.id1
    FROM overlapping
    WHERE meta.archetype_id = overlapping.id2;
    RAISE NOTICE '[%] Updated archetype in meta', clock_timestamp();

    UPDATE archetype
    SET
        medoid_id = get_medoid(id)
    FROM overlapping
    WHERE archetype.id = overlapping.id1;
    RAISE NOTICE '[%] Updated medoid in archetype', clock_timestamp();

    DELETE FROM archetype
    WHERE id IN (SELECT id2 FROM overlapping);
    RAISE NOTICE '[%] Deleted outdated archetype', clock_timestamp();

    UPDATE meta
    SET
        distance = deck_distance(deck_id, (SELECT medoid_id FROM archetype WHERE id = archetype_id))
    FROM overlapping;
    RAISE NOTICE '[%] Updated distance in meta', clock_timestamp();

    DELETE FROM graph
    WHERE id1 IN (SELECT id2 FROM overlapping)
    OR id2 IN (SELECT id2 FROM overlapping);
    RAISE NOTICE '[%] Deleted outdated graph references', clock_timestamp();

    UPDATE graph
    SET deck_distance = deck_distance(
        (SELECT medoid_id FROM archetype WHERE id = id1),
        (SELECT medoid_id FROM archetype WHERE id = id2));
    RAISE NOTICE '[%] Updated remaining graph references', clock_timestamp();
    
    DELETE FROM overlapping;
    RAISE NOTICE '[%] Clean overlapping', clock_timestamp();
END LOOP;

DELETE FROM meta
WHERE id NOT IN (
    SELECT MIN(id)
    FROM meta
    GROUP BY deck_id, archetype_id, distance
);

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
