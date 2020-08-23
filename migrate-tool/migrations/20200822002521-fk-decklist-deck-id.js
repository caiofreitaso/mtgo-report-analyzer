'use strict';

var dbm;
var type;
var seed;

const TABLE_NAME = 'decklist';
const KEY_NAME = 'fk__decklist__deck_id';

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
  return db.addForeignKey(TABLE_NAME, 'deck', KEY_NAME, {
    deck_id: 'id'
  }, {
    onDelete: 'RESTRICT',
    onUpdate: 'RESTRICT'
  });
};

exports.down = function(db) {
  return db.removeForeignKey(TABLE_NAME, KEY_NAME);
};

exports._meta = {
  "version": 1
};
