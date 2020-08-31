'use strict';

var dbm;
var type;
var seed;

const FUNCTION_NAME = 'view_archetype_decklists';

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
    card_types card.types%TYPE,
    card_name decklist.card_name%TYPE,
    quantity decklist.quantity%TYPE,
    is_sideboard decklist.is_sideboard%TYPE,
    is_nonland_main decklist.is_nonland_main%TYPE,
    label archetype.label%TYPE,
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
    card.types,
    decklist.card_name,
    decklist.quantity,
    decklist.is_sideboard,
    decklist.is_nonland_main,
    archetype.label,
    meta.distance,
    deck.player,
    deck.position,
    tournament.date
FROM decklist
JOIN card
ON card.name = decklist.card_name
JOIN meta
ON meta.deck_id = decklist.deck_id
JOIN archetype
ON meta.archetype_id = archetype.id
JOIN deck
ON deck.id = decklist.deck_id
JOIN tournament
ON tournament.id = deck.tournament_id
WHERE archetype.id = chosen_id
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
