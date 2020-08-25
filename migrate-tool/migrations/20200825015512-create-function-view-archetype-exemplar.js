'use strict';

var dbm;
var type;
var seed;

const FUNCTION_NAME = 'view_archetype_exemplar';

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
CREATE OR REPLACE FUNCTION ${FUNCTION_NAME}(archetype_id int)
RETURNS TABLE(
    card_types card.types%TYPE,
    card_name decklist.card_name%TYPE,
    quantity decklist.quantity%TYPE,
    is_sideboard decklist.is_sideboard%TYPE,
    is_nonland_main decklist.is_nonland_main%TYPE,
    label archetype.label%TYPE
)
LANGUAGE plpgsql AS $$
BEGIN
RETURN QUERY
SELECT
    card.types,
    decklist.card_name,
    decklist.quantity,
    decklist.is_sideboard,
    decklist.is_nonland_main,
    archetype.label
FROM decklist
JOIN archetype
ON decklist.deck_id = archetype.medoid_id
JOIN card
ON card.name = decklist.card_name
WHERE archetype.id = archetype_id
ORDER BY decklist.id;
END;
$$;`);
};

exports.down = function(db) {
  return db.runSql(`DROP FUNCTION ${FUNCTION_NAME}`);
};

exports._meta = {
  "version": 1
};
