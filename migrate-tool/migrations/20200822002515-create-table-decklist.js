'use strict';

var dbm;
var type;
var seed;

const TABLE_NAME = 'decklist';

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
  return db.createTable(TABLE_NAME, {
    id: { type: 'int', primaryKey: true, autoIncrement: true, unsigned: true },
    deck_id: { type: 'int', notNull: true },
    card_id: { type: 'int', notNull: true },
    quantity: { type: 'int', unsigned: true, notNull: true },
    is_sideboard: { type: 'bool', notNull: true }
  });
};

exports.down = function(db) {
  return db.dropTable(TABLE_NAME);
};

exports._meta = {
  "version": 1
};
