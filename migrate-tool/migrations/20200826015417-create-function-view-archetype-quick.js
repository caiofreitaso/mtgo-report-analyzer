'use strict';

var dbm;
var type;
var seed;

const FUNCTION_NAME = 'view_archetype_quick';

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
CREATE OR REPLACE FUNCTION ${FUNCTION_NAME}(chosen_id int)
RETURNS TABLE(
    deck_id deck.id%TYPE,
    card_name decklist.card_name%TYPE,
    distance meta.distance%TYPE,
    player deck.player%TYPE,
    "position" deck.position%TYPE,
    date tournament.date%TYPE
)
LANGUAGE plpgsql AS $$
BEGIN
RETURN QUERY
SELECT
    decklist.deck_id,
    decklist.card_name,
    meta.distance,
    deck.player,
    deck.position,
    tournament.date
FROM decklist
JOIN card
ON card.name = decklist.card_name
JOIN meta
ON meta.deck_id = decklist.deck_id
JOIN deck
ON deck.id = decklist.deck_id
JOIN tournament
ON tournament.id = deck.tournament_id
WHERE meta.archetype_id = chosen_id
AND is_nonland_main
ORDER BY meta.distance, decklist.id;
END;
$$;`);
};

exports.down = function(db) {
  return db.runSql(`DROP FUNCTION ${FUNCTION_NAME}`);
};

exports._meta = {
  "version": 1
};
