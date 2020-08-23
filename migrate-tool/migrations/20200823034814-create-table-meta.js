'use strict';

var dbm;
var type;
var seed;

const TABLE_NAME = 'meta';

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
    archetype_id: { type: 'int', notNull: true },
    deck_id: { type: 'int', notNull: true },
    distance: { type: 'bigint', defaultValue: 120 }
  });
};

exports.down = function(db) {
  return db.dropTable(TABLE_NAME);
};

exports._meta = {
  "version": 1
};
