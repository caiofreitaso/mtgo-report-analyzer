'use strict';

var dbm;
var type;
var seed;

const TABLE_NAME = 'archetype';
const KEY_NAME = 'fk__archetype__median_id';

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
    median_id: 'id'
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
